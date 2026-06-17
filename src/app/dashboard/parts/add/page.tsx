"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, LayoutGrid, FileText, MapPin, ClipboardCheck, Zap, Cpu, Wifi, Box } from "lucide-react";

interface HsnCode {
  id: string;
  code: string;
  description: string;
  gst_rate: number | null;
}

interface LocationItem {
  id: string;
  zone: string;
  rack: string | null;
  shelf: string | null;
  bin: string | null;
  label: string;
}

interface Category {
  id: string;
  name: string;
  label: string;
}

interface Subcategory {
  id: string;
  name: string;
  label: string;
}

const getSubcategoryLabel = (catName: string, subName: string) => {
  if (subName === "module") {
    switch (catName) {
      case "electronic": return "Module (ESP32, Pico, Relay Board)";
      case "electrical": return "Module (Power Supply, SSR, Controller)";
      case "iot": return "Module (WiFi, BLE, GPS, GSM)";
      default: return "Module";
    }
  }
  if (subName === "component") {
    switch (catName) {
      case "electronic": return "Component (Resistor, Cap, Transistor)";
      case "electrical": return "Component (Wire, Fuse, Switch, Connector)";
      case "iot": return "Component (Antenna, eSIM, Crystal)";
      default: return "Component";
    }
  }
  if (subName === "device") {
    switch (catName) {
      case "electronic": return "Device (Completed PCB, Instrument)";
      case "electrical": return "Device (MCB, Panel Meter, Contactor)";
      case "iot": return "Device (Gateway, Smart Sensor, Tracker)";
      default: return "Device";
    }
  }
  return subName;
};

const formatLocationLabel = (label: string) => {
  return label
    .split(" > ")
    .filter(part => !part.toLowerCase().includes("default shelf") && !part.toLowerCase().includes("default bin"))
    .join(" > ");
};

export default function AddPartWizard() {
  const router = useRouter();
  const { data: session } = useSession();

  // Loaders & Errors
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wizard state
  const [step, setStep] = useState(1);

  // Form State
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState("");

  // Step 2 Form details
  const [name, setName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [hsnCodeId, setHsnCodeId] = useState("");
  const [pkg, setPkg] = useState("");
  const [comment, setComment] = useState("");
  const [datasheetUrl, setDatasheetUrl] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  
  // Category-specific specs
  const [voltage, setVoltage] = useState("");
  const [current, setCurrent] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [valSpec, setValSpec] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [commProtocol, setCommProtocol] = useState("");
  const [frequency, setFrequency] = useState("");
  const [supplier, setSupplier] = useState("");

  // Step 3 Form details
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("pcs");
  const [minQuantity, setMinQuantity] = useState("");
  const [locationMode, setLocationMode] = useState<"existing" | "new">("existing");
  const [newZone, setNewZone] = useState("Store");
  const [newRack, setNewRack] = useState("");
  const [newShelf, setNewShelf] = useState("");
  const [newBin, setNewBin] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch HSN
        const hsnRes = await fetch("/api/hsn");
        if (!hsnRes.ok) throw new Error("Failed to load HSN codes");
        const hsnData = await hsnRes.json();
        setHsnCodes(hsnData);

        // Fetch Locations
        const locRes = await fetch("/api/locations");
        if (!locRes.ok) throw new Error("Failed to load locations");
        const locData = await locRes.json();
        setLocations(locData);

        // Fetch Categories
        const catRes = await fetch("/api/locations"); // Wait, categories can be fetched from the DB but we didn't write an API yet.
        // Let's seed categories state directly or fetch them.
        // Wait, let's look at prisma seed:
        // name: 'electrical' | 'electronic' | 'iot' | 'general'
        // Let's make an API call or query categories directly. We'll add category fetch later, but for now let's mock categories locally since they are static:
        setCategories([
          { id: "1", name: "electrical", label: "Electrical" },
          { id: "2", name: "electronic", label: "Electronic" },
          { id: "3", name: "iot", label: "IoT" },
          { id: "4", name: "general", label: "General" }
        ]);

        setSubcategories([
          { id: "2-1", name: "module", label: "Module" },
          { id: "2-2", name: "component", label: "Component" },
          { id: "2-3", name: "device", label: "Device" }
        ]);

      } catch (err) {
        setError("Failed to load wizard dependency data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNext = () => {
    if (step === 1 && !selectedCategoryName) {
      alert("Please select a category.");
      return;
    }
    if (step === 1 && selectedCategoryName !== "general" && selectedCategoryName !== "" && !selectedSubcategoryName) {
      alert("Please select a subcategory.");
      return;
    }
    if (step === 2) {
      if (!name) {
        alert("Part Name is required.");
        return;
      }
      if (!hsnCodeId) {
        alert("HSN Code is required.");
        return;
      }
    }
    if (step === 3) {
      if (locationMode === "existing" && !locationId) {
        alert("Location is required.");
        return;
      }
      if (locationMode === "new" && !newZone) {
        alert("Zone is required for new location.");
        return;
      }
      if (parseInt(quantity) < 0) {
        alert("Quantity must be greater than or equal to 0.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    setSubmitting(true);
    setSubmitError("");

    // Prepare comments/specification bundle
    let specDetails = [];
    if (selectedCategoryName === "electrical") {
      if (voltage) specDetails.push(`Voltage: ${voltage}`);
      if (current) specDetails.push(`Current: ${current}`);
    } else if (selectedCategoryName === "electronic") {
      if (manufacturer) specDetails.push(`Manufacturer: ${manufacturer}`);
      if (valSpec) specDetails.push(`Value: ${valSpec}`);
      if (tolerance) specDetails.push(`Tolerance: ${tolerance}`);
    } else if (selectedCategoryName === "iot") {
      if (commProtocol) specDetails.push(`Protocols: ${commProtocol}`);
      if (frequency) specDetails.push(`Freq: ${frequency}`);
      if (manufacturer) specDetails.push(`Manufacturer: ${manufacturer}`);
    } else if (selectedCategoryName === "general") {
      if (supplier) specDetails.push(`Supplier: ${supplier}`);
    }

    const finalComment = comment 
      ? `${comment}${specDetails.length ? ` | Specs: ${specDetails.join(", ")}` : ""}`
      : specDetails.join(", ");

    // Map Category IDs (using names to match our database seeded categories)
    // Wait, let's find the correct category UUID from our seeded database or just query it on the backend!
    // On the backend, in POST /api/parts, we can allow passing category name directly or find category by name!
    // Let's adjust the backend or write a quick categories lookup.
    // In our POST API route, let's check: it takes category_id. We can pass category name or fetch category ID from DB.
    // To make it easy, we can fetch all categories from the database or query them. Let's see: we can query the category ID dynamically!
    // Let's modify the payload to include category_name and subcategory_name so the API can resolve their IDs automatically if we send them!
    // Wait, let's check what the API expects: it expects `category_id` and `subcategory_id`.
    // Let's query categories from `/api/locations`? No.
    // Let's check: we can fetch categories from the database using a quick API route or resolve on the client!
    // Since we seed categories, we can just find them in the database.
    // Let's create a quick categories route `/api/categories` to make this extremely robust! Or we can update `/api/parts` to automatically resolve categories if names are provided.
    // Let's update `POST /api/parts` to resolve category_id and subcategory_id by name if they are not UUIDs!
    // That is brilliant and extremely robust! Let's check if we can do that. Yes! We can check if category_id matches UUID format, if not we search for category by name. Same for subcategory!

    // Let's gather payload
    const payload = {
      name,
      part_number: partNumber,
      category_id: selectedCategoryName, // Will resolve by name on API
      subcategory_id: selectedSubcategoryName || null, // Will resolve by name on API
      hsn_code_id: hsnCodeId,
      package: pkg,
      comment: finalComment,
      datasheet_url: datasheetUrl,
      purchase_url: purchaseUrl || null,
      price_per_unit: pricePerUnit ? parseFloat(pricePerUnit) : null,
      location_id: locationMode === "existing" ? locationId : "new",
      new_location: locationMode === "new" ? {
        zone: newZone,
        rack: newRack || null,
        shelf: newShelf || null,
        bin: newBin || null,
        description: newDescription || null
      } : null,
      quantity: parseInt(quantity),
      unit,
      min_quantity: minQuantity ? parseInt(minQuantity) : null
    };

    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save stock item");
      }

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve Category name for dynamic fields
  const renderCategorySpecs = () => {
    if (selectedCategoryName === "electrical") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Voltage Rating</label>
            <input type="text" value={voltage} onChange={(e) => setVoltage(e.target.value)} placeholder="e.g. 230V AC" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Current Rating</label>
            <input type="text" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="e.g. 10A" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      );
    }
    if (selectedCategoryName === "electronic") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Manufacturer</label>
            <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g. Espressif" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Value / Specification</label>
            <input type="text" value={valSpec} onChange={(e) => setValSpec(e.target.value)} placeholder="e.g. 10k Ohm" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Tolerance</label>
            <input type="text" value={tolerance} onChange={(e) => setTolerance(e.target.value)} placeholder="e.g. 1%" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      );
    }
    if (selectedCategoryName === "iot") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Manufacturer</label>
            <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g. Quectel" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Comm Protocol</label>
            <input type="text" value={commProtocol} onChange={(e) => setCommProtocol(e.target.value)} placeholder="e.g. WiFi, BLE, LoRa" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Operating Frequency</label>
            <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. 2.4 GHz" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      );
    }
    if (selectedCategoryName === "general") {
      return (
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Supplier</label>
          <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Vendor name" className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary" />
        </div>
      );
    }
    return null;
  };

  if (success) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 max-w-xl mx-auto text-center space-y-6 mt-12">
        <CheckCircle className="w-16 h-16 text-success mx-auto" />
        <h2 className="text-2xl font-bold text-text-primary">Stock Added Successfully</h2>
        <p className="text-sm text-text-secondary">
          The new part and its initial stock quantity have been recorded, and the movement audit log has been updated.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setSuccess(false);
              setStep(1);
              setSelectedCategoryName("");
              setSelectedSubcategoryName("");
              setName("");
              setPartNumber("");
              setPkg("");
              setComment("");
              setDatasheetUrl("");
              setPurchaseUrl("");
              setPricePerUnit("");
              setLocationMode("existing");
              setNewZone("Store");
              setNewRack("");
              setNewShelf("");
              setNewBin("");
              setNewDescription("");
              setQuantity("0");
              setMinQuantity("");
            }}
            className="border border-border hover:bg-bg/40 px-4 py-2 rounded text-sm text-text-primary transition-colors"
          >
            Add Another Item
          </button>
          <button
            onClick={() => router.push("/dashboard/parts")}
            className="bg-primary hover:bg-primary-dark text-bg font-bold px-4 py-2 rounded text-sm transition-colors"
          >
            View Parts Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Add New Stock</h2>
        <p className="text-sm text-text-secondary">Follow the steps to catalog parts and input initial quantities</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between bg-surface border border-border px-6 py-4 rounded-lg">
        {[
          { num: 1, label: "Category", icon: LayoutGrid },
          { num: 2, label: "Details", icon: FileText },
          { num: 3, label: "Location & Qty", icon: MapPin },
          { num: 4, label: "Confirm", icon: ClipboardCheck }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step === s.num 
                ? "bg-primary text-bg" 
                : step > s.num 
                  ? "bg-success/20 text-success border border-success/30" 
                  : "bg-bg text-text-secondary border border-border"
            }`}>
              {s.num}
            </span>
            <span className={`text-sm hidden sm:inline ${step === s.num ? "text-text-primary font-semibold" : "text-text-secondary"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Contents */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm min-h-[300px]">
        {/* Step 1: Category Selector */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Select Part Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "electrical", label: "Electrical", desc: "Wires, fuses, switches, connectors", icon: Zap },
                { name: "electronic", label: "Electronic", desc: "Modules, components, and devices", icon: Cpu },
                { name: "iot", label: "IoT", desc: "RF, gateways, SIM cards, sensors", icon: Wifi },
                { name: "general", label: "General", desc: "Consumables, tools, fasteners, casing", icon: Box }
              ].map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategoryName(cat.name);
                    setSelectedSubcategoryName("");
                  }}
                  className={`flex items-start text-left p-4 rounded-lg border transition-all ${
                    selectedCategoryName === cat.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-text-secondary"
                  }`}
                >
                  <cat.icon className={`w-8 h-8 mr-4 ${selectedCategoryName === cat.name ? "text-primary" : "text-text-secondary"}`} />
                  <div>
                    <h4 className="font-bold text-text-primary">{cat.label}</h4>
                    <p className="text-xs text-text-secondary mt-1">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Subcategories (for all categories except General) */}
            {selectedCategoryName !== "" && selectedCategoryName !== "general" && (
              <div className="border-t border-border pt-6 space-y-4">
                <h4 className="text-sm font-semibold text-text-secondary uppercase">
                  Select {selectedCategoryName} Subcategory
                </h4>
                <div className="flex gap-4">
                  {[
                    { name: "module", label: getSubcategoryLabel(selectedCategoryName, "module") },
                    { name: "component", label: getSubcategoryLabel(selectedCategoryName, "component") },
                    { name: "device", label: getSubcategoryLabel(selectedCategoryName, "device") }
                  ].map((sub) => (
                    <button
                      key={sub.name}
                      onClick={() => setSelectedSubcategoryName(sub.name)}
                      className={`flex-1 py-3 px-4 rounded text-center border text-sm transition-all ${
                        selectedSubcategoryName === sub.name
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-text-secondary text-text-secondary"
                      }`}
                      title={sub.label}
                    >
                      {sub.label.split(" (")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Part Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Part Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Resistor 10k 1/4W"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Part Number</label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="Manufacturer Part Number"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">HSN Code *</label>
                <select
                  value={hsnCodeId}
                  onChange={(e) => setHsnCodeId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Select HSN Code</option>
                  {hsnCodes.map((hsn) => (
                    <option key={hsn.id} value={hsn.id}>
                      {hsn.code} - {hsn.description.substring(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Package</label>
                <input
                  type="text"
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value)}
                  placeholder="e.g. 0603, SOT-23, DIP-8"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Dynamic specs depending on category */}
            {renderCategorySpecs()}

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Datasheet URL</label>
              <input
                type="url"
                value={datasheetUrl}
                onChange={(e) => setDatasheetUrl(e.target.value)}
                placeholder="https://example.com/datasheet.pdf"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono text-xs text-info"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Purchase URL / Link</label>
                <input
                  type="url"
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  placeholder="https://example.com/buy-part"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono text-xs text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Price per Unit (INR)</label>
                <input
                  type="number"
                  step="any"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  placeholder="e.g. 15.50"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Comment / Notes</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional description, purchase info, or links..."
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary h-20 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Location and Qty */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Stock & Placement</h3>

            {/* Location Mode Toggle */}
            <div className="flex gap-4 border-b border-border pb-4">
              <button
                type="button"
                onClick={() => setLocationMode("existing")}
                className={`py-2 px-4 rounded text-sm font-semibold transition-colors ${
                  locationMode === "existing"
                    ? "bg-primary text-bg"
                    : "border border-border text-text-secondary hover:border-text-primary"
                }`}
              >
                Select Existing Location
              </button>
              <button
                type="button"
                onClick={() => setLocationMode("new")}
                className={`py-2 px-4 rounded text-sm font-semibold transition-colors ${
                  locationMode === "new"
                    ? "bg-primary text-bg"
                    : "border border-border text-text-secondary hover:border-text-primary"
                }`}
              >
                Create New Location
              </button>
            </div>

            {locationMode === "existing" ? (
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Storage Location *</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {formatLocationLabel(loc.label)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4 border border-border p-4 rounded bg-bg/20">
                <h4 className="text-sm font-bold text-text-primary">New Location Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Zone *</label>
                    <input
                      type="text"
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      placeholder="e.g. Store, Component Lab"
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Rack</label>
                    <input
                      type="text"
                      value={newRack}
                      onChange={(e) => setNewRack(e.target.value)}
                      placeholder="e.g. 6, A1, Z2"
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Shelf</label>
                    <input
                      type="text"
                      value={newShelf}
                      onChange={(e) => setNewShelf(e.target.value)}
                      placeholder="e.g. Shelf 2"
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Bin</label>
                    <input
                      type="text"
                      value={newBin}
                      onChange={(e) => setNewBin(e.target.value)}
                      placeholder="e.g. Bin 4"
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional details about this new storage container..."
                    className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Initial Quantity *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                >
                  <option value="pcs">pcs</option>
                  <option value="rolls">rolls</option>
                  <option value="metres">metres</option>
                  <option value="sets">sets</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Min Alert Threshold</label>
                <input
                  type="number"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  placeholder="Low stock warning alert"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review and Save */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-text-primary">Review Part Details</h3>

            {submitError && (
              <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm">
                {submitError}
              </div>
            )}

            <div className="bg-bg/40 rounded-lg border border-border divide-y divide-border text-sm">
              <div className="p-4 grid grid-cols-3">
                <span className="text-text-secondary font-semibold">Category</span>
                <span className="col-span-2 text-text-primary capitalize">
                  {selectedCategoryName} {selectedSubcategoryName && ` > ${selectedSubcategoryName}`}
                </span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="text-text-secondary font-semibold">Part Name</span>
                <span className="col-span-2 text-text-primary font-bold">{name}</span>
              </div>
              {partNumber && (
                <div className="p-4 grid grid-cols-3">
                  <span className="text-text-secondary font-semibold">Part Number</span>
                  <span className="col-span-2 text-text-primary font-mono">{partNumber}</span>
                </div>
              )}
              <div className="p-4 grid grid-cols-3">
                <span className="text-text-secondary font-semibold">HSN Code</span>
                <span className="col-span-2 text-text-primary font-mono">
                  {hsnCodes.find((h) => h.id === hsnCodeId)?.code || "N/A"}
                </span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="text-text-secondary font-semibold">Storage Location</span>
                <span className="col-span-2 text-text-primary">
                  {locationMode === "existing" ? (
                    formatLocationLabel(locations.find((l) => l.id === locationId)?.label || "N/A")
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                        New
                      </span>
                      {formatLocationLabel(`${newZone} > ${newRack || "Default"} > ${newShelf || "Default"} > ${newBin || "Default"}`)}
                    </span>
                  )}
                </span>
              </div>
              <div className="p-4 grid grid-cols-3">
                <span className="text-text-secondary font-semibold">Initial Stock</span>
                <span className="col-span-2 text-text-primary font-bold">
                  {quantity} {unit} {minQuantity && `(Alert trigger < ${minQuantity} ${unit})`}
                </span>
              </div>
              {pricePerUnit && (
                <div className="p-4 grid grid-cols-3">
                  <span className="text-text-secondary font-semibold">Price per Unit</span>
                  <span className="col-span-2 text-text-primary font-bold">₹{parseFloat(pricePerUnit).toFixed(2)}</span>
                </div>
              )}
              {purchaseUrl && (
                <div className="p-4 grid grid-cols-3">
                  <span className="text-text-secondary font-semibold">Purchase Link</span>
                  <span className="col-span-2 text-text-primary font-mono text-xs text-info truncate">{purchaseUrl}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-lg">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="border border-border hover:bg-bg/40 text-text-primary font-bold py-2 px-4 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="bg-primary hover:bg-primary-dark text-bg font-bold py-2 px-4 rounded text-sm flex items-center gap-2 transition-colors ml-auto"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={submitting}
            className="bg-success hover:bg-success/90 text-white font-bold py-2 px-6 rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50 ml-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Stock Item"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
