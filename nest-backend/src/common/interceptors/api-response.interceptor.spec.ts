import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Observable, of } from 'rxjs';
import { ApiResponseInterceptor } from './api-response.interceptor';

describe('ApiResponseInterceptor', () => {
  let interceptor: ApiResponseInterceptor<any>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(async () => {
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {},
        }),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockCallHandler = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CallHandler>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiResponseInterceptor],
    }).compile();

    interceptor = module.get<ApiResponseInterceptor<any>>(ApiResponseInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response in ApiResponse format', (done) => {
    const mockData = { id: '1', name: 'Test' };
    mockCallHandler.handle.mockReturnValue(of(mockData));

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data', mockData);
      expect(result).toHaveProperty('message', undefined);
      expect(result).toHaveProperty('errors', undefined);
      done();
    });
  });

  it('should preserve existing ApiResponse format', (done) => {
    const mockData = {
      success: true,
      data: { id: '1', name: 'Test' },
    };
    mockCallHandler.handle.mockReturnValue(of(mockData));

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      done();
    });
  });

  it('should handle array responses', (done) => {
    const mockData = [
      { id: '1', name: 'Test 1' },
      { id: '2', name: 'Test 2' },
    ];
    mockCallHandler.handle.mockReturnValue(of(mockData));

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('success', true);
      expect(result.data).toEqual(mockData);
      done();
    });
  });

  it('should handle null responses', (done) => {
    mockCallHandler.handle.mockReturnValue(of(null));

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data', null);
      done();
    });
  });

  it('should handle string responses', (done) => {
    const mockData = 'test string';
    mockCallHandler.handle.mockReturnValue(of(mockData));

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('success', true);
      expect(result.data).toBe(mockData);
      done();
    });
  });

  it('should handle number responses', (done) => {
    const mockData = 42;
    mockCallHandler.handle.mockReturnValue(of(mockData));

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('success', true);
      expect(result.data).toBe(mockData);
      done();
    });
  });

  it('should skip interceptor for SSE requests', (done) => {
    const mockRequest = {
      headers: {
        accept: 'text/event-stream',
      },
    };
    mockContext.switchToHttp.mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    });

    const mockData = { id: '1' };
    mockCallHandler.handle.mockReturnValue(of(mockData) as unknown as Observable<any>);

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(mockData);
      done();
    });
  });
});
