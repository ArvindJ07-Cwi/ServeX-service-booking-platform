// Shared city list used across Register, Checkout, and Profile pages
// Update this single file to change cities everywhere

export const INDIAN_CITIES = [
    // Maharashtra
    'Mumbai',
    'Pune',
    'Nagpur',
    'Nashik',
    'Thane',
    'Navi Mumbai',
    'Aurangabad',
    'Kolhapur',
    'Solapur',
    'Amravati',
    'Akola',
    'Ahmednagar',
    'Jalgaon',
    'Sangli',
    'Satara',
    'Ratnagiri',
    // Goa
    'Goa',
    // South India
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kochi',
    // North India
    'Delhi',
    'Noida',
    'Gurgaon',
    // East India
    'Kolkata',
    // Rajasthan & Gujarat
    'Jaipur',
    'Ahmedabad',
    'Surat',
    // Central India
    'Indore',
    'Bhopal',
    // North India
    'Lucknow',
    'Chandigarh',
].sort();

// Render as <option> elements (call inside a <select>)
export const CityOptions = () => (
    <>
        <option value="">Select city</option>
        {INDIAN_CITIES.map(c => (
            <option key={c} value={c}>{c}</option>
        ))}
    </>
);
