const companiesService = require("../../src/services/companies.service");
const companiesRepository = require("../../src/repositories/companies.repository");
const { NotFoundError } = require("../../src/errors/AppError");

jest.mock("../../src/repositories/companies.repository");

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
    it("should create company", async () => {
      const data = { name: "ACME" };
      companiesRepository.create.mockResolvedValue({ id: 1, ...data });
      await companiesService.create(data);
      expect(companiesRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe("update", () => {
    it("should update company", async () => {
      companiesRepository.getById.mockResolvedValue({ id: 1 });
      companiesRepository.update.mockResolvedValue({ id: 1, name: "New" });

      await companiesService.update(1, { name: "New" });

      expect(companiesRepository.update).toHaveBeenCalledWith(1, { name: "New" });
    });

    it("should throw NotFound if company missing", async () => {
      companiesRepository.getById.mockResolvedValue(null);
      await expect(companiesService.update(99, {})).rejects.toThrow(NotFoundError);
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
