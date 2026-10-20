export function groupByCity(data) {
  const grouped = {};
  data.forEach((entry) => {
    if (!grouped[entry.cityName]) grouped[entry.cityName] = [];
    grouped[entry.cityName].push(entry);
  });
  Object.values(grouped).forEach((arr) =>
    arr.sort((a, b) => (a.margheritaPrice || 0) - (b.margheritaPrice || 0))
  );
  return grouped;
}
