import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import addproductRouter from '../../../routers/admin/productadd.js';

// Mock AWS S3 utilities
jest.mock('../../../utils/aws_s3.js', () => ({
  deleteFile: jest.fn(),
  upload: {
    array: () => (req, res, next) => {
      req.files = []; // Mock uploaded files
      next();
    }
  }
}));

// Mock the Product model
jest.mock('../../../models/productscema.js', () => {
  return {
    Product: jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockImplementation(() => Promise.resolve(data))
    }))
  };
});

const app = express();
app.use(express.json());
app.use('/api', addproductRouter);

// Import mocked modules
import { Product } from '../../../models/productscema.js';
import { deleteFile } from '../../../utils/aws_s3.js';

describe('Product Router Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up static methods
    Product.findById = jest.fn();
    Product.findByIdAndDelete = jest.fn();
    Product.find = jest.fn();
    Product.countDocuments = jest.fn();
    Product.findByIdAndUpdate = jest.fn();
  });

  describe('POST /api/addproduct', () => {
    it('should create a new product', async () => {
      const mockProductData = {
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        category: 'electronics',
        brand: 'TestBrand',
        seller: 'TestSeller',
        images: []
      };

      const response = await request(app)
        .post('/api/addproduct')
        .field('name', mockProductData.name)
        .field('price', mockProductData.price)
        .field('stock', mockProductData.stock)
        .field('category', mockProductData.category)
        .field('brand', mockProductData.brand)
        .field('seller', mockProductData.seller);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product added successfully');
      expect(response.body.product).toMatchObject(expect.objectContaining({
        name: mockProductData.name,
        price: mockProductData.price.toString(),
        stock: mockProductData.stock.toString(),
        category: mockProductData.category,
        brand: mockProductData.brand,
        seller: mockProductData.seller
      }));
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/addproduct')
        .field('name', 'Test Product');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });

  describe('DELETE /api/deleteproduct/:id', () => {
    it('should delete a product', async () => {
      const mockProduct = {
        _id: 'test123',
        images: [{ public_id: 'test-image-1' }]
      };

      Product.findById.mockResolvedValue(mockProduct);
      Product.findByIdAndDelete.mockResolvedValue(mockProduct);
      deleteFile.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/deleteproduct/test123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product and images deleted successfully');
      expect(deleteFile).toHaveBeenCalledWith('test-image-1');
    });

    it('should return 404 for non-existent product', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/deleteproduct/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('GET /api/products', () => {
    it('should get products with pagination', async () => {
      const mockProducts = [
        { _id: '1', name: 'Product 1', price: 99.99 },
        { _id: '2', name: 'Product 2', price: 149.99 }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe('PATCH /api/editproduct/:id', () => {
    it('should update a product', async () => {
      const mockProduct = {
        _id: 'test123',
        name: 'Old Name',
        price: 99.99
      };

      const updates = {
        name: 'Updated Name',
        price: 149.99
      };

      Product.findById.mockResolvedValue(mockProduct);
      Product.findByIdAndUpdate.mockResolvedValue({ ...mockProduct, ...updates });

      const response = await request(app)
        .patch('/api/editproduct/test123')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product updated successfully');
      expect(response.body.product.name).toBe(updates.name);
    });

    it('should return 404 for non-existent product', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/editproduct/nonexistent')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });
});
