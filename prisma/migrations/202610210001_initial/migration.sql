-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PROCESSING', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CREATED', 'APPROVED', 'REJECTED', 'CANCELLED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "ActorKind" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OperationKind" AS ENUM ('CREATE_RETURN', 'APPROVE', 'REJECT', 'CANCEL', 'RECEIVE', 'UPDATE_POLICY', 'RESET');

-- CreateEnum
CREATE TYPE "RateCategory" AS ENUM ('MUTATION_MINUTE', 'RESET_HOUR', 'CREATE_ENVIRONMENT_HOUR');

-- CreateTable
CREATE TABLE "VisitorContext" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEnvironmentExpiredAt" TIMESTAMPTZ,

    CONSTRAINT "VisitorContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoEnvironment" (
    "id" UUID NOT NULL,
    "visitorId" UUID NOT NULL,
    "capabilityHash" TEXT NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "lastActivityAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "priceMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "generation" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "generation" INTEGER NOT NULL,
    "customerId" UUID NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "orderedAt" TIMESTAMPTZ NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "deliveredAt" TIMESTAMPTZ,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "generation" INTEGER NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" INTEGER NOT NULL,
    "purchasedQuantity" INTEGER NOT NULL,
    "purchasePriceMinor" BIGINT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnPolicy" (
    "environmentId" UUID NOT NULL,
    "windowDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ReturnPolicy_pkey" PRIMARY KEY ("environmentId")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "generation" INTEGER NOT NULL,
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "generation" INTEGER NOT NULL,
    "requestId" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEvent" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "generation" INTEGER NOT NULL,
    "requestId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "eventType" "EventType" NOT NULL,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorKind" "ActorKind" NOT NULL,
    "actorCustomerId" UUID,
    "reason" TEXT,

    CONSTRAINT "HistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationReceipt" (
    "id" UUID NOT NULL,
    "environmentId" UUID NOT NULL,
    "inputGeneration" INTEGER NOT NULL,
    "operationId" UUID NOT NULL,
    "operationKind" "OperationKind" NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "actorScope" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvisionReceipt" (
    "visitorId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "nonce" TEXT NOT NULL,
    "resultEnvironmentId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvisionReceipt_pkey" PRIMARY KEY ("visitorId","operationId")
);

-- CreateTable
CREATE TABLE "RateBucket" (
    "visitorHash" TEXT NOT NULL,
    "category" "RateCategory" NOT NULL,
    "windowStart" TIMESTAMPTZ NOT NULL,
    "attempts" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "RateBucket_pkey" PRIMARY KEY ("visitorHash","category","windowStart")
);

-- CreateTable
CREATE TABLE "CapacityGuard" (
    "id" INTEGER NOT NULL,

    CONSTRAINT "CapacityGuard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitorContext_tokenHash_key" ON "VisitorContext"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "DemoEnvironment_visitorId_key" ON "DemoEnvironment"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoEnvironment_capabilityHash_key" ON "DemoEnvironment"("capabilityHash");

-- CreateIndex
CREATE INDEX "DemoEnvironment_lastActivityAt_idx" ON "DemoEnvironment"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_environmentId_generation_id_key" ON "Customer"("environmentId", "generation", "id");

-- CreateIndex
CREATE INDEX "Order_environmentId_generation_customerId_orderedAt_idx" ON "Order"("environmentId", "generation", "customerId", "orderedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_environmentId_generation_id_key" ON "Order"("environmentId", "generation", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_environmentId_generation_id_customerId_key" ON "Order"("environmentId", "generation", "id", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_environmentId_generation_displayNumber_key" ON "Order"("environmentId", "generation", "displayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_environmentId_generation_id_orderId_key" ON "OrderItem"("environmentId", "generation", "id", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_environmentId_generation_orderId_productId_key" ON "OrderItem"("environmentId", "generation", "orderId", "productId");

-- CreateIndex
CREATE INDEX "ReturnRequest_environmentId_generation_status_createdAt_id_idx" ON "ReturnRequest"("environmentId", "generation", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ReturnRequest_environmentId_generation_customerId_createdAt_idx" ON "ReturnRequest"("environmentId", "generation", "customerId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_environmentId_generation_id_key" ON "ReturnRequest"("environmentId", "generation", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_environmentId_generation_id_orderId_key" ON "ReturnRequest"("environmentId", "generation", "id", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_environmentId_generation_displayNumber_key" ON "ReturnRequest"("environmentId", "generation", "displayNumber");

-- CreateIndex
CREATE INDEX "ReturnItem_orderItemId_idx" ON "ReturnItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnItem_requestId_orderItemId_key" ON "ReturnItem"("requestId", "orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoryEvent_requestId_sequence_key" ON "HistoryEvent"("requestId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "OperationReceipt_environmentId_inputGeneration_operationId_key" ON "OperationReceipt"("environmentId", "inputGeneration", "operationId");

-- CreateIndex
CREATE INDEX "RateBucket_expiresAt_idx" ON "RateBucket"("expiresAt");


-- Scoped ownership and domain invariants.
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "ReturnPolicy" ADD CONSTRAINT "ReturnPolicy_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "OperationReceipt" ADD CONSTRAINT "OperationReceipt_environment_fk" FOREIGN KEY ("environmentId") REFERENCES "DemoEnvironment" ("id") ON DELETE CASCADE;
ALTER TABLE "DemoEnvironment" ADD CONSTRAINT "DemoEnvironment_visitor_fk" FOREIGN KEY ("visitorId") REFERENCES "VisitorContext" ("id") ON DELETE CASCADE;
ALTER TABLE "ProvisionReceipt" ADD CONSTRAINT "ProvisionReceipt_visitor_fk" FOREIGN KEY ("visitorId") REFERENCES "VisitorContext" ("id") ON DELETE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_customer_fk" FOREIGN KEY ("environmentId", "generation", "customerId") REFERENCES "Customer" ("environmentId", "generation", "id") ON DELETE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_fk" FOREIGN KEY ("environmentId", "generation", "orderId") REFERENCES "Order" ("environmentId", "generation", "id") ON DELETE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_fk" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_order_customer_fk" FOREIGN KEY ("environmentId", "generation", "orderId", "customerId") REFERENCES "Order" ("environmentId", "generation", "id", "customerId") ON DELETE CASCADE;
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_request_order_fk" FOREIGN KEY ("environmentId", "generation", "requestId", "orderId") REFERENCES "ReturnRequest" ("environmentId", "generation", "id", "orderId") ON DELETE CASCADE;
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_order_item_fk" FOREIGN KEY ("environmentId", "generation", "orderItemId", "orderId") REFERENCES "OrderItem" ("environmentId", "generation", "id", "orderId") ON DELETE CASCADE;
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_request_fk" FOREIGN KEY ("environmentId", "generation", "requestId") REFERENCES "ReturnRequest" ("environmentId", "generation", "id") ON DELETE CASCADE;
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_actor_fk" FOREIGN KEY ("environmentId", "generation", "actorCustomerId") REFERENCES "Customer" ("environmentId", "generation", "id") ON DELETE CASCADE;
ALTER TABLE "DemoEnvironment" ADD CONSTRAINT "DemoEnvironment_domain_check" CHECK ("generation" > 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_domain_check" CHECK ("priceMinor" >= 0 AND "currency" = 'USD');
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_domain_check" CHECK ("purchasedQuantity" > 0 AND "purchasePriceMinor" >= 0);
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_domain_check" CHECK ("quantity" > 0);
ALTER TABLE "ReturnPolicy" ADD CONSTRAINT "ReturnPolicy_domain_check" CHECK ("windowDays" > 0);
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_domain_check" CHECK ("version" > 0 AND length(btrim("reason")) BETWEEN 1 AND 1000 AND (("status" = 'REJECTED' AND "rejectionReason" IS NOT NULL AND length(btrim("rejectionReason")) BETWEEN 1 AND 1000) OR ("status" <> 'REJECTED' AND "rejectionReason" IS NULL)));
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_domain_check" CHECK ("sequence" > 0 AND (("eventType" IN ('CREATED','CANCELLED') AND "actorKind" = 'CUSTOMER' AND "actorCustomerId" IS NOT NULL) OR ("eventType" IN ('APPROVED','REJECTED','RECEIVED') AND "actorKind" = 'ADMIN' AND "actorCustomerId" IS NULL)) AND ("eventType" <> 'REJECTED' OR ("reason" IS NOT NULL AND length(btrim("reason")) BETWEEN 1 AND 1000)));
ALTER TABLE "RateBucket" ADD CONSTRAINT "RateBucket_domain_check" CHECK ("attempts" >= 0);
ALTER TABLE "CapacityGuard" ADD CONSTRAINT "CapacityGuard_domain_check" CHECK ("id" = 1);
INSERT INTO "CapacityGuard" (id) VALUES (1);
