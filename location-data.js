const BCKGeo = (() => {
  const REST_COUNTRIES = 'https://restcountries.com/v3.1/all?fields=cca2,unMember,name';
  const COUNTRIES_NOW = 'https://countriesnow.space/api/v0.1/countries';
  let countryRows = [];

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Location service returned ${response.status}`);
    return response.json();
  }

  function sortByName(a, b) {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  }

  async function loadCountriesAndStates() {
    const [restCountries, statesResponse] = await Promise.all([
      fetchJson(REST_COUNTRIES),
      fetchJson(`${COUNTRIES_NOW}/states`)
    ]);

    const sovereignIso2 = new Set(
      restCountries
        .filter(country => country.unMember || ['PS', 'VA'].includes(country.cca2))
        .map(country => country.cca2)
    );

    const stateRows = Array.isArray(statesResponse?.data) ? statesResponse.data : [];
    countryRows = stateRows
      .filter(country => sovereignIso2.has(country.iso2))
      .map(country => ({
        iso2: country.iso2,
        name: country.name,
        states: Array.isArray(country.states) ? country.states : []
      }))
      .sort(sortByName);

    const indiaIndex = countryRows.findIndex(country => country.iso2 === 'IN');
    if (indiaIndex > 0) {
      const [india] = countryRows.splice(indiaIndex, 1);
      countryRows.unshift(india);
    }

    return countryRows;
  }

  function countries() {
    return countryRows;
  }

  function countryByIso2(iso2) {
    return countryRows.find(country => country.iso2 === iso2) || null;
  }

  function countryByName(name) {
    const normal = String(name || '').trim().toLowerCase();
    return countryRows.find(country => country.name.toLowerCase() === normal) || null;
  }

  function statesFor(iso2) {
    const country = countryByIso2(iso2);
    return (country?.states || [])
      .map(state => ({ name: state.name, code: state.state_code || '' }))
      .sort(sortByName);
  }

  async function citiesFor(iso2, stateName) {
    const country = countryByIso2(iso2);
    if (!country || !stateName || stateName === '__NONE__') return [];

    const url = `${COUNTRIES_NOW}/state/cities/q?country=${encodeURIComponent(country.name)}&state=${encodeURIComponent(stateName)}`;
    const response = await fetchJson(url);
    const cities = Array.isArray(response?.data) ? response.data : [];
    return [...new Set(cities.filter(Boolean).map(city => String(city).trim()))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  return { loadCountriesAndStates, countries, countryByIso2, countryByName, statesFor, citiesFor };
})();

window.BCKGeo = BCKGeo;
