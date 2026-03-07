import { TRPCError } from "@trpc/server";

/**
 * Professional error handler for database operations.
 * Extracts specific constraint violations and returns user-friendly messages.
 */
export function handleDbError(error: any): never {
  const message = error?.message || "";
  
  // Unique constraint violations
  if (message.includes("UNIQUE constraint failed")) {
    if (message.includes("products.sku")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A product with this SKU already exists." });
    }
    if (message.includes("products.barcode")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A product with this barcode already exists." });
    }
    if (message.includes("users.openId")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This username is already taken." });
    }
    if (message.includes("categories.name")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A category with this name already exists." });
    }
    if (message.includes("suppliers.name")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A supplier with this name already exists." });
    }
    
    throw new TRPCError({ code: "BAD_REQUEST", message: "This record already exists in the system." });
  }

  // Foreign key violations
  if (message.includes("FOREIGN KEY constraint failed")) {
    throw new TRPCError({ 
      code: "BAD_REQUEST", 
      message: "This record cannot be deleted or modified because it is being used elsewhere in the system." 
    });
  }

  // Not null violations
  if (message.includes("NOT NULL constraint failed")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Please ensure all required fields are filled out." });
  }

  // Default fallback
  console.error("[Database Error]:", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An error occurred while processing your request. Please try again.",
  });
}
