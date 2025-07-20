from rest_framework import generics, status, filters
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from django.db import models
from common.utils import APIResponse
from common.models import UserActivity
from .models import HSCode, Category, Product, StockInvoice, StockInvoiceLineItem
from .serializers import (
    HSCodeSerializer, CategorySerializer, ProductSerializer, ProductListSerializer,
    StockInvoiceSerializer, StockInvoiceListSerializer, StockInvoiceLineItemSerializer
)


class HSCodeListCreateView(generics.ListCreateAPIView):
    """
    List all HS codes or create a new HS code.
    Filters by current user's activated company.
    """
    serializer_class = HSCodeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['code', 'description']
    ordering_fields = ['code', 'description', 'created_at']
    ordering = ['code']
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return HSCode.objects.none()
            
            return HSCode.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'created_by')
        except UserActivity.DoesNotExist:
            return HSCode.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="HS codes retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving HS codes: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise ValueError('No company activated. Please activate a company first.')
            
            serializer.save(
                company=user_activity.current_company,
                created_by=user
            )
        except UserActivity.DoesNotExist:
            raise ValueError('User activity not found. Please activate a company first.')
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="HS code created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error creating HS code: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class HSCodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an HS code.
    """
    serializer_class = HSCodeSerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return HSCode.objects.none()
            
            return HSCode.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'created_by')
        except UserActivity.DoesNotExist:
            return HSCode.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="HS code retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving HS code: {str(e)}",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="HS code updated successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error updating HS code: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Check if HS code has categories
            if instance.categories.exists():
                return APIResponse.error(
                    message="Cannot delete HS code with existing categories",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            super().destroy(request, *args, **kwargs)
            return APIResponse.success(
                message="HS code deleted successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error deleting HS code: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class CategoryListCreateView(generics.ListCreateAPIView):
    """
    List all categories or create a new category.
    Filters by current user's activated company.
    """
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hs_code', 'is_active']
    search_fields = ['name', 'description', 'hs_code__code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return Category.objects.none()
            
            return Category.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'hs_code', 'created_by')
        except UserActivity.DoesNotExist:
            return Category.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Categories retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving categories: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise ValueError('No company activated. Please activate a company first.')
            
            serializer.save(
                company=user_activity.current_company,
                created_by=user
            )
        except UserActivity.DoesNotExist:
            raise ValueError('User activity not found. Please activate a company first.')
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Category created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error creating category: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a category.
    """
    serializer_class = CategorySerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return Category.objects.none()
            
            return Category.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'hs_code', 'created_by')
        except UserActivity.DoesNotExist:
            return Category.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Category retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving category: {str(e)}",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Category updated successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error updating category: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Check if category has products
            if instance.products.exists():
                return APIResponse.error(
                    message="Cannot delete category with existing products",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            super().destroy(request, *args, **kwargs)
            return APIResponse.success(
                message="Category deleted successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error deleting category: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class ProductListCreateView(generics.ListCreateAPIView):
    """
    List all products or create a new product.
    Filters by current user's activated company.
    """
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'unit_of_measure', 'is_active']
    search_fields = ['code', 'name', 'description', 'barcode']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['code']
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return Product.objects.none()
            
            return Product.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'category', 'created_by')
        except UserActivity.DoesNotExist:
            return Product.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Products retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving products: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise ValueError('No company activated. Please activate a company first.')
            
            serializer.save(
                company=user_activity.current_company,
                created_by=user
            )
        except UserActivity.DoesNotExist:
            raise ValueError('User activity not found. Please activate a company first.')
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Product created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error creating product: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a product.
    """
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return Product.objects.none()
            
            return Product.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'category', 'created_by')
        except UserActivity.DoesNotExist:
            return Product.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Product retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving product: {str(e)}",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Product updated successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error updating product: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Check if product has stock movements
            if instance.stock_movements.exists():
                return APIResponse.error(
                    message="Cannot delete product with existing stock movements",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            super().destroy(request, *args, **kwargs)
            return APIResponse.success(
                message="Product deleted successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error deleting product: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class StockInvoiceListCreateView(generics.ListCreateAPIView):
    """
    List all stock invoices or create a new stock invoice.
    Filters by current user's activated company and financial year.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['invoice_type', 'status', 'invoice_date']
    search_fields = ['invoice_number', 'party_name', 'reference_number']
    ordering_fields = ['invoice_date', 'invoice_number', 'created_at']
    ordering = ['-invoice_date', '-invoice_number']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return StockInvoiceListSerializer
        return StockInvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company or not user_activity.current_financial_year:
                return StockInvoice.objects.none()
            
            return StockInvoice.objects.filter(
                company=user_activity.current_company,
                financial_year=user_activity.current_financial_year
            ).select_related(
                'company', 'financial_year', 'created_by'
            ).prefetch_related('line_items__product')
        except UserActivity.DoesNotExist:
            return StockInvoice.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Stock invoices retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving stock invoices: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise ValueError('No company activated. Please activate a company first.')
            if not user_activity.current_financial_year:
                raise ValueError('No financial year activated. Please activate a financial year first.')
            
            serializer.save(
                company=user_activity.current_company,
                financial_year=user_activity.current_financial_year,
                created_by=user
            )
        except UserActivity.DoesNotExist:
            raise ValueError('User activity not found. Please activate a company and financial year first.')
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Stock invoice created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error creating stock invoice: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class StockInvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a stock invoice.
    """
    serializer_class = StockInvoiceSerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company or not user_activity.current_financial_year:
                return StockInvoice.objects.none()
            
            return StockInvoice.objects.filter(
                company=user_activity.current_company,
                financial_year=user_activity.current_financial_year
            ).select_related(
                'company', 'financial_year', 'created_by'
            ).prefetch_related('line_items__product')
        except UserActivity.DoesNotExist:
            return StockInvoice.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Stock invoice retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving stock invoice: {str(e)}",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Stock invoice updated successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error updating stock invoice: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Only allow deletion of draft invoices
            if instance.status != 'draft':
                return APIResponse.error(
                    message="Only draft invoices can be deleted",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            super().destroy(request, *args, **kwargs)
            return APIResponse.success(
                message="Stock invoice deleted successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error deleting stock invoice: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
def confirm_stock_invoice(request, pk):
    """
    Confirm a stock invoice and update product stock levels.
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company or not user_activity.current_financial_year:
            return APIResponse.error(
                message="No company or financial year activated",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            stock_invoice = StockInvoice.objects.get(
                id=pk,
                company=user_activity.current_company,
                financial_year=user_activity.current_financial_year
            )
        except StockInvoice.DoesNotExist:
            return APIResponse.error(
                message="Stock invoice not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        if stock_invoice.status != 'draft':
            return APIResponse.error(
                message="Only draft invoices can be confirmed",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Confirm invoice and update stock
        stock_invoice.status = 'confirmed'
        stock_invoice.save()
        stock_invoice.update_stock()
        
        serializer = StockInvoiceSerializer(stock_invoice)
        return APIResponse.success(
            data=serializer.data,
            message="Stock invoice confirmed successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error confirming stock invoice: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def products_list(request):
    """
    Get simplified products list for dropdowns and selection.
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company:
            return APIResponse.error(
                message="No company activated. Please activate a company first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        products = Product.objects.filter(
            company=user_activity.current_company,
            is_active=True
        ).select_related('category').order_by('code')
        
        serializer = ProductListSerializer(products, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Products list retrieved successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found. Please activate a company first.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving products list: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def invoice_types(request):
    """
    Get available stock invoice types.
    """
    try:
        types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in StockInvoice.INVOICE_TYPES
        ]
        return APIResponse.success(
            data=types,
            message="Invoice types retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving invoice types: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def unit_choices(request):
    """
    Get available unit of measure choices.
    """
    try:
        units = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Product.UNIT_CHOICES
        ]
        return APIResponse.success(
            data=units,
            message="Unit choices retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving unit choices: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def low_stock_products(request):
    """
    Get products with low stock levels.
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company:
            return APIResponse.error(
                message="No company activated. Please activate a company first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Get products where current_stock <= minimum_stock
        low_stock_products = Product.objects.filter(
            company=user_activity.current_company,
            is_active=True,
            current_stock__lte=F('minimum_stock')
        ).select_related('category').order_by('code')
        
        serializer = ProductSerializer(low_stock_products, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Low stock products retrieved successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found. Please activate a company first.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving low stock products: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )