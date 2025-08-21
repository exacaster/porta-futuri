interface ProductFeaturesProps {
  attributes: Record<string, any>;
}

export function ProductFeatures({ attributes }: ProductFeaturesProps) {
  // Convert attributes object to displayable format
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {return 'N/A';}
    if (Array.isArray(value)) {return value.join(', ');}
    if (typeof value === 'boolean') {return value ? 'Yes' : 'No';}
    if (typeof value === 'object') {return JSON.stringify(value);}
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Sort attributes alphabetically
  const sortedEntries = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b));

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No additional features available for this product.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid layout for attributes */}
      <div className="grid md:grid-cols-2 gap-4">
        {sortedEntries.map(([key, value]) => (
          <div key={key} className="border-b border-gray-100 pb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="font-medium text-gray-700">{formatKey(key)}</span>
              <span className="text-gray-900 sm:text-right">{formatValue(value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}