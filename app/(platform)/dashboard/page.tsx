export default function PlatformDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Platform Owner</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Entreprises</h2>
          <p className="text-3xl font-bold">2</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Livraisons</h2>
          <p className="text-3xl font-bold">-</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Zones</h2>
          <p className="text-3xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
}
