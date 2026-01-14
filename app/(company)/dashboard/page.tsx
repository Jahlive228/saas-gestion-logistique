export default function CompanyDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Entreprise</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Livraisons du jour</h2>
          <p className="text-3xl font-bold">-</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">En retard</h2>
          <p className="text-3xl font-bold">-</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Livrées</h2>
          <p className="text-3xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
}
