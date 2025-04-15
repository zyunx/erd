console.log("Hello, ERD!");

// Use MVP pattern
// Model
erd = erd_create();
// View
erdv = erdv_init();
// Presentor
erdp = erdp_create(erd, erdv);
