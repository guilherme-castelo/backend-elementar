const companiesService = require("../../src/services/companies.service");
const companiesRepository = require("../../src/repositories/companies.repository");
const { NotFoundError } = require("../../src/errors/AppError");

jest.mock("../../src/repositories/companies.repository");
jest.mock("../../src/utils/prisma", () => ({
  company: { update: jest.fn() },
  role: { findUnique: jest.fn() },
  userMembership: { upsert: jest.fn() },
}));
const prisma = require("../../src/utils/prisma");

describe("CompaniesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all companies", async () => {
      companiesRepository.getAll.mockResolvedValue([]);
      await companiesService.getAll();
      expect(companiesRepository.getAll).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return company if found", async () => {
      companiesRepository.getById.mockResolvedValue({ id: 1 });
      const res = await companiesService.getById(1);
      expect(res).toEqual({ id: 1 });
    });

    it("should throw NotFound if not found", async () => {
      companiesRepository.getById.mockResolvedValue(null);
      await expect(companiesService.getById(99)).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    it("should create company without manager", async () => {
      const data = { name: "ACME" };
      companiesRepository.create.mockResolvedValue({ id: 1, ...data });
      await companiesService.create(data);
      expect(companiesRepository.create).toHaveBeenCalledWith(data);
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it("should create company and assign manager", async () => {
      const data = { name: "ACME", managerId: 10 };
      companiesRepository.create.mockResolvedValue({ id: 1, name: "ACME" });
      prisma.role.findUnique.mockResolvedValue({ id: 5 }); // Manager Role

      await companiesService.create(data);

      expect(companiesRepository.create).toHaveBeenCalledWith({ name: "ACME" });
      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { managerId: 10 },
      });
      expect(prisma.userMembership.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ roleId: 5 }),
        })
      );
    });

    it("should use default role if Manager role not found", async () => {
      const data = { name: "ACME", managerId: 10 };
      companiesRepository.create.mockResolvedValue({ id: 1 });
      prisma.role.findUnique.mockResolvedValue(null);

      await companiesService.create(data);

      expect(prisma.userMembership.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ roleId: 1 }),
        })
      );
    });
  });

  describe("update", () => {
    it("should update company", async () => {
      companiesRepository.getById.mockResolvedValue({ id: 1 });
      companiesRepository.update.mockResolvedValue({ id: 1, name: "New" });

      await companiesService.update(1, { name: "New" });

      expect(companiesRepository.update).toHaveBeenCalledWith(1, {
        name: "New",
      });
    });

    it("should update and assign manager", async () => {
      companiesRepository.getById.mockResolvedValue({ id: 1 });
      companiesRepository.update.mockResolvedValue({ id: 1 });

      await companiesService.update(1, { managerId: 10 });

      expect(prisma.company.update).toHaveBeenCalled();
    });

    it("should throw NotFound if company missing", async () => {
      companiesRepository.getById.mockResolvedValue(null);
      await expect(companiesService.update(99, {})).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("delete", () => {
    it("should delete company", async () => {
      companiesRepository.getById.mockResolvedValue({ id: 1 });
      companiesRepository.delete.mockResolvedValue({ id: 1 });

      await companiesService.delete(1);

      expect(companiesRepository.delete).toHaveBeenCalledWith(1);
    });

    it("should throw NotFound if company missing", async () => {
      companiesRepository.getById.mockResolvedValue(null);
      await expect(companiesService.delete(99)).rejects.toThrow(NotFoundError);
    });
  });
});
