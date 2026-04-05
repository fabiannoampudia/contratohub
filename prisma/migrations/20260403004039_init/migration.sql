-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "commercialContact" TEXT,
    "operationalContact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "criticality" TEXT NOT NULL DEFAULT 'Média',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitValue" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "paymentFrequency" TEXT,
    "adjustmentType" TEXT,
    "adjustmentMonth" INTEGER,
    "adjustmentIndex" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "noticePeriodDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Novo',
    "responsible" TEXT,
    "mapping" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_cnpj_key" ON "Supplier"("cnpj");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
