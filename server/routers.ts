import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import { z } from "zod";
import { ENV } from "./_core/env";
import {
  adjustStock,
  closeShift,
  createCategory,
  createCustomer,
  createEmployee,
  createOrder,
  createShift,
  createProduct,
  createSupplier,
  createPurchaseOrder,
  deleteCategory,
  deleteCustomer,
  deleteEmployee,
  deleteProduct,
  deleteSupplier,
  getAllSettings,
  getAllUsers,
  getCategories,
  getCategoryById,
  getCustomerById,
  getCustomers,
  getDailySalesData,
  getEmployeeById,
  getEmployees,
  getEmployeeSalesStats,
  getInventoryAdjustments,
  getLowStockProducts,
  getOrderById,
  getOrderItems,
  getOrders,
  getPaymentMethodBreakdown,
  getPurchaseOrders,
  getProductByBarcode,
  getProductById,
  getProductBySku,
  getProducts,
  getSalesReport,
  getShifts,
  getSuppliers,
  getTopProducts,
  setSettings,
  updateCategory,
  updateCustomer,
  updateEmployee,
  updateOrderStatus,
  updateProduct,
  updateSupplier,
  updatePurchaseOrderStatus,
  updateUserRole,
  verifyUserCredentials,
  } from "./db";
import { storagePut } from "./storage";
import { handleDbError } from "./lib/error-handler";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, managerProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  storage: router({
    upload: adminProcedure
      .input(z.object({ name: z.string(), base64: z.string(), contentType: z.string() }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(input.name, buffer, input.contentType);
        return { url };
      }),
  }),

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ openId: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        const user = await verifyUserCredentials(input.openId, input.password);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({ openId: user.openId, role: user.role })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("24h")
          .sign(secret);

        return { token, user };
      }),
  }),

  // ─── Settings ───────────────────────────────────────────────────────────────
  settings: router({
    getAll: protectedProcedure.query(() => getAllSettings()),
    get: protectedProcedure.query(() => getAllSettings()),
    update: adminProcedure
      .input(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).transform(v => String(v))))
      .mutation(({ input }) => setSettings(input)),
  }),

  // ─── Categories ─────────────────────────────────────────────────────────────
  categories: router({
    list: protectedProcedure.query(() => getCategories()),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getCategoryById(input.id)),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          color: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await createCategory(input);
        } catch (e) {
          handleDbError(e);
        }
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          color: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          return await updateCategory(id, data);
        } catch (e) {
          handleDbError(e);
        }
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        return await deleteCategory(input.id);
      } catch (e) {
        handleDbError(e);
      }
    }),
  }),

  // ─── Suppliers ──────────────────────────────────────────────────────────────
  suppliers: router({
    list: managerProcedure.query(() => getSuppliers()),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          contactName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          tin: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await createSupplier(input);
        } catch (e) {
          handleDbError(e);
        }
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          contactName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          tin: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          return await updateSupplier(id, data);
        } catch (e) {
          handleDbError(e);
        }
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        return await deleteSupplier(input.id);
      } catch (e) {
        handleDbError(e);
      }
    }),
  }),

  // ─── Products ───────────────────────────────────────────────────────────────
  products: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), categoryId: z.number().optional(), lowStock: z.boolean().optional() }).optional())
      .query(({ input }) => getProducts(input)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getProductById(input.id)),
    getByBarcode: protectedProcedure.input(z.object({ barcode: z.string() })).query(({ input }) => getProductByBarcode(input.barcode)),
    create: adminProcedure
      .input(
        z.object({
          sku: z.string().min(1),
          barcode: z.string().optional(),
          name: z.string().min(1),
          description: z.string().optional(),
          categoryId: z.number().optional(),
          price: z.string(),
          costPrice: z.string().optional(),
          taxRate: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.boolean().optional(),
          stockQuantity: z.number().optional(),
          reorderPoint: z.number().optional(),
          unit: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await createProduct(input);
        } catch (e) {
          handleDbError(e);
        }
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          sku: z.string().optional(),
          barcode: z.string().optional(),
          name: z.string().optional(),
          description: z.string().optional(),
          categoryId: z.number().optional().nullable(),
          price: z.string().optional(),
          costPrice: z.string().optional(),
          taxRate: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.boolean().optional(),
          stockQuantity: z.number().optional(),
          reorderPoint: z.number().optional(),
          unit: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          return await updateProduct(id, data);
        } catch (e) {
          handleDbError(e);
        }
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        return await deleteProduct(input.id);
      } catch (e) {
        handleDbError(e);
      }
    }),
    lowStock: protectedProcedure.query(() => getLowStockProducts()),
  }),

  // ─── Inventory ──────────────────────────────────────────────────────────────
  inventory: router({
    adjustments: managerProcedure
      .input(z.object({ productId: z.number().optional() }).optional())
      .query(({ input }) => getInventoryAdjustments(input?.productId)),
    adjust: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          type: z.enum(["restock", "adjustment", "return", "damage"]),
          quantityChange: z.number(),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await adjustStock(input.productId, ctx.user.id, input.type, input.quantityChange, input.note);
        } catch (e) {
          handleDbError(e);
        }
      }),
    lowStock: managerProcedure.query(() => getLowStockProducts()),
  }),

  // ─── Purchase Orders ──────────────────────────────────────────────────────────
  purchaseOrders: router({
    list: managerProcedure.query(() => getPurchaseOrders()),
    create: adminProcedure
      .input(
        z.object({
          poNumber: z.string().min(1),
          supplierId: z.number(),
          status: z.enum(["draft", "ordered", "received", "cancelled"]),
          subtotal: z.string(),
          taxAmount: z.string().optional(),
          totalAmount: z.string(),
          notes: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              quantity: z.number(),
              costPrice: z.string(),
              taxRate: z.string().optional(),
              lineTotal: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { items, ...poData } = input;
          return await createPurchaseOrder(poData, items);
        } catch (e) {
          handleDbError(e);
        }
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["draft", "ordered", "received", "cancelled"]) }))
      .mutation(async ({ input }) => {
        try {
          return await updatePurchaseOrderStatus(input.id, input.status);
        } catch (e) {
          handleDbError(e);
        }
      }),
  }),

  // ─── Customers ──────────────────────────────────────────────────────────────
  customers: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => getCustomers(input?.search)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getCustomerById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await createCustomer(input);
        } catch (e) {
          handleDbError(e);
        }
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          loyaltyPoints: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          return await updateCustomer(id, data);
        } catch (e) {
          handleDbError(e);
        }
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        return await deleteCustomer(input.id);
      } catch (e) {
        handleDbError(e);
      }
    }),
    orders: protectedProcedure.input(z.object({ customerId: z.number() })).query(({ input }) => getOrders({ customerId: input.customerId })),
  }),

  // ─── Employees ──────────────────────────────────────────────────────────────
  employees: router({
    list: protectedProcedure.query(() => getEmployees()),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getEmployeeById(input.id)),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          role: z.enum(["admin", "cashier", "manager"]).optional(),
          pin: z.string().max(6).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await createEmployee(input);
        } catch (e) {
          handleDbError(e);
        }
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          role: z.enum(["admin", "cashier", "manager"]).optional(),
          pin: z.string().max(6).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          return await updateEmployee(id, data);
        } catch (e) {
          handleDbError(e);
        }
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        return await deleteEmployee(input.id);
      } catch (e) {
        handleDbError(e);
      }
    }),
    shifts: protectedProcedure
      .input(z.object({ employeeId: z.number().optional() }).optional())
      .query(({ input }) => getShifts(input?.employeeId)),
    startShift: protectedProcedure
      .input(z.object({ employeeId: z.number(), openingCash: z.string().optional() }))
      .mutation(async ({ input }) => {
        try {
          return await createShift({ employeeId: input.employeeId, startTime: new Date().toISOString(), openingCash: input.openingCash });
        } catch (e) {
          handleDbError(e);
        }
      }),
    endShift: protectedProcedure
      .input(z.object({ shiftId: z.number(), closingCash: z.string().optional(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        try {
          return await closeShift(input.shiftId, { endTime: new Date().toISOString(), closingCash: input.closingCash, notes: input.notes });
        } catch (e) {
          handleDbError(e);
        }
      }),
  }),

  // ─── Orders ─────────────────────────────────────────────────────────────────
  orders: router({
    list: protectedProcedure
      .input(
        z
          .object({
            from: z.date().optional(),
            to: z.date().optional(),
            status: z.string().optional(),
            customerId: z.number().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .query(({ input }) => getOrders(input)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await getOrderItems(input.id);
      return { ...order, items };
    }),
    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number().optional(),
          employeeId: z.number().optional(),
          shiftId: z.number().optional(),
          subtotal: z.string(),
          taxAmount: z.string().optional(),
          discountAmount: z.string().optional(),
          totalAmount: z.string(),
          paymentMethod: z.enum(["cash", "card", "wallet", "mixed"]),
          amountPaid: z.string(),
          changeGiven: z.string().optional(),
          loyaltyPointsEarned: z.number().optional(),
          loyaltyPointsUsed: z.number().optional(),
          notes: z.string().optional(),
          payments: z.array(
            z.object({
              method: z.enum(["cash", "card", "wallet"]),
              amount: z.string(),
              reference: z.string().optional(),
            })
          ).optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              productSku: z.string().optional(),
              quantity: z.number(),
              unitPrice: z.string(),
              taxRate: z.string().optional(),
              taxAmount: z.string().optional(),
              discountAmount: z.string().optional(),
              lineTotal: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { items, payments, ...orderData } = input;
          
          // Handle split payments vs legacy single payment
          const finalPayments = payments && payments.length > 0 
            ? payments 
            : [{ 
                method: orderData.paymentMethod === "mixed" ? "cash" : orderData.paymentMethod as any, 
                amount: orderData.amountPaid 
              }];

          const result = await createOrder({ ...orderData, status: "completed" }, items, finalPayments);
          return { orderId: result };
        } catch (e) {
          handleDbError(e);
        }
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "completed", "refunded", "cancelled"]) }))
      .mutation(({ input }) => updateOrderStatus(input.id, input.status)),
  }),

  // ─── Reports ────────────────────────────────────────────────────────────────
  reports: router({
    summary: managerProcedure
      .input(z.object({ from: z.date(), to: z.date() }))
      .query(({ input }) => getSalesReport(input.from, input.to)),
    daily: managerProcedure.input(z.object({ days: z.number().optional() }).optional()).query(({ input }) => getDailySalesData(input?.days ?? 30)),
    topProducts: managerProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(({ input }) => getTopProducts(input?.limit ?? 10)),
    paymentBreakdown: managerProcedure
      .input(z.object({ from: z.date(), to: z.date() }))
      .query(({ input }) => getPaymentMethodBreakdown(input.from, input.to)),
    employeeStats: managerProcedure
      .input(z.object({ from: z.date(), to: z.date() }))
      .query(({ input }) => getEmployeeSalesStats(input.from, input.to)),
  }),
});

export type AppRouter = typeof appRouter;
