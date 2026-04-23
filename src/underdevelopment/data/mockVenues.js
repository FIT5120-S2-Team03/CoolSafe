export const MOCK_OPENING_HOURS = {
  "Athenaeum Theatre": {
    Monday:    null,
    Tuesday:   { open: "10:00", close: "21:00" },
    Wednesday: { open: "10:00", close: "21:00" },
    Thursday:  { open: "10:00", close: "21:00" },
    Friday:    { open: "10:00", close: "21:00" },
    Saturday:  { open: "10:00", close: "21:00" },
    Sunday:    { open: "12:00", close: "18:00" },
  },
  "Melbourne City Baths": {
    Monday:    { open: "06:00", close: "21:30" },
    Tuesday:   { open: "06:00", close: "21:30" },
    Wednesday: { open: "06:00", close: "21:30" },
    Thursday:  { open: "06:00", close: "21:30" },
    Friday:    { open: "06:00", close: "20:00" },
    Saturday:  { open: "08:00", close: "18:00" },
    Sunday:    { open: "08:00", close: "18:00" },
  },
  "State Library Victoria": {
    Monday:    { open: "10:00", close: "21:00" },
    Tuesday:   { open: "10:00", close: "21:00" },
    Wednesday: { open: "10:00", close: "21:00" },
    Thursday:  { open: "10:00", close: "21:00" },
    Friday:    { open: "10:00", close: "18:00" },
    Saturday:  { open: "10:00", close: "18:00" },
    Sunday:    { open: "12:00", close: "18:00" },
  },
  "Queen Victoria Market": {
    Monday:    null,
    Tuesday:   { open: "06:00", close: "14:00" },
    Wednesday: null,
    Thursday:  { open: "06:00", close: "14:00" },
    Friday:    { open: "06:00", close: "17:00" },
    Saturday:  { open: "06:00", close: "15:00" },
    Sunday:    { open: "09:00", close: "16:00" },
  },
}

export const MOCK_VENUE_DETAILS = {
  "Athenaeum Theatre": {
    address: "188 Collins St, Melbourne VIC 3000",
    phone: "(03) 9650 1500",
    lat: -37.8136,
    lng: 144.9646,
    opening_hours: MOCK_OPENING_HOURS["Athenaeum Theatre"],
  },
}
