export default function ContactMap({ address = "" }: { address?: string }) {
  if (!address) {
    return null;
  }

  // No API key needed for the "search by query" embed form - it geocodes
  // whatever address the admin has configured, so this stays accurate
  // without a maintained set of lat/lng coordinates.
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="rbt-component-area rbt-bg-color-gray-light">
      <div className="container">
        <div className="rbt-google-map bg-color-white rbt-section-gap2Top">
          <iframe
            className="w-100"
            title="Store location"
            src={mapSrc}
            height={600}
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
