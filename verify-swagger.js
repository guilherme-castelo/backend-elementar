const specs = require("./src/config/swagger");

try {
  console.log("Reading generated Swagger JSON...");

  // The specs object is already the generated JSON
  if (!specs || !specs.components || !specs.components.schemas) {
    throw new Error("Invalid Swagger specs structure!");
  }

  const schemaKeys = Object.keys(specs.components.schemas);
  console.log("Schemas found:", schemaKeys.join(", "));

  if (!schemaKeys.includes("User") || !schemaKeys.includes("Task")) {
    throw new Error("Missing critical schemas!");
  }

  console.log("Swagger JSON is valid!");
} catch (error) {
  console.error("Swagger verification failed:", error);
  process.exit(1);
}
