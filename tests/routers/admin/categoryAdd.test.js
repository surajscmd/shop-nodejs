import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import categoryRouter from '../../../routers/admin/catogoryadd.js';

// Mock the Category model
jest.mock('../../../models/catagoryschema.js', () => {
  return {
    Category: jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
      deleteOne: jest.fn().mockResolvedValue(true)
    }))
  };
});

const app = express();
app.use(express.json());
app.use('/api', categoryRouter);

// Import mocked modules
import { Category } from '../../../models/catagoryschema.js';

// Close server after all tests
let server;
beforeAll(async () => {
  server = app.listen(0);
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Category Router Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up static methods
    Category.findOne = jest.fn();
    Category.findById = jest.fn();
    Category.find = jest.fn();
  });

  describe('POST /api/addcategory', () => {
    it('should create a new category', async () => {
      const mockCategoryData = {
        name: 'Electronics'
      };

      // Mock that category doesn't exist
      Category.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/addcategory')
        .send(mockCategoryData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Category added successfully');
      expect(response.body.category).toMatchObject(mockCategoryData);
    });

    it('should return 400 if category already exists', async () => {
      const mockCategoryData = {
        name: 'Electronics'
      };

      // Mock that category already exists
      Category.findOne.mockResolvedValue(mockCategoryData);

      const response = await request(app)
        .post('/api/addcategory')
        .send(mockCategoryData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Category already exists');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/addcategory')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });

    it('should handle server errors', async () => {
      const mockCategoryData = {
        name: 'Electronics'
      };

      // Mock a server error
      Category.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/addcategory')
        .send(mockCategoryData);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('DELETE /api/deletecategory/:id', () => {
    it('should delete a category', async () => {
      const mockCategory = {
        _id: 'test123',
        name: 'Electronics',
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      Category.findById.mockResolvedValue(mockCategory);

      const response = await request(app)
        .delete('/api/deletecategory/test123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');
      expect(mockCategory.deleteOne).toHaveBeenCalled();
    });

    it('should return 404 for non-existent category', async () => {
      Category.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/deletecategory/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Category not found');
    });

    it('should handle server errors', async () => {
      Category.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/deletecategory/test123');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('GET /api/allcategories', () => {
    it('should get all categories', async () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics' },
        { _id: '2', name: 'Books' }
      ];

      const mockSort = jest.fn().mockResolvedValue(mockCategories);
      Category.find.mockReturnValue({ sort: mockSort });

      const response = await request(app)
        .get('/api/allcategories');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should handle errors when getting categories', async () => {
      const mockError = new Error('Database error');
      Category.find.mockImplementation(() => {
        throw mockError;
      });

      const response = await request(app)
        .get('/api/allcategories');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe(mockError.message);
    });
  });
});
