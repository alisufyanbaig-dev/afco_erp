from rest_framework import generics, status, filters
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from django.db import models
from common.utils import APIResponse
from common.models import UserActivity
from .models import Party, HSCode, Category, Product, StockInvoice, StockInvoiceLineItem, StockMovement, StockMovementReport
from .serializers import (
    PartySerializer, PartyListSerializer, HSCodeSerializer, CategorySerializer, 
    ProductSerializer, ProductListSerializer, StockInvoiceSerializer, 
    StockInvoiceListSerializer, StockInvoiceLineItemSerializer
)


class PartyListCreateView(generics.ListCreateAPIView):
    """
    List all parties or create a new party.
    Filters by current user's activated company.
    """
    serializer_class = PartySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['party_type', 'is_active']
    search_fields = ['name', 'contact_person', 'phone', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return Party.objects.none()
            
            return Party.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'created_by')
        except UserActivity.DoesNotExist:
            return Party.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Parties retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving parties: {str(e)}",
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
                message="Party created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error creating party: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class PartyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a party.
    """
    serializer_class = PartySerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return Party.objects.none()
            
            return Party.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'created_by')
        except UserActivity.DoesNotExist:
            return Party.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Party retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving party: {str(e)}",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Party updated successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error updating party: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Check if party has stock invoices
            if instance.stock_invoices.exists():
                return APIResponse.error(
                    message="Cannot delete party with existing stock invoices",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            super().destroy(request, *args, **kwargs)
            return APIResponse.success(
                message="Party deleted successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error deleting party: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
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
    filterset_fields = ['invoice_type', 'invoice_date']
    search_fields = ['invoice_number', 'party__name', 'reference_number']
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
                'company', 'financial_year', 'party', 'created_by'
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
                'company', 'financial_year', 'party', 'created_by'
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
            # Note: All invoices are now posted immediately, no draft status
            # Allow deletion but warn about stock impact
            
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
    DEPRECATED: All stock invoices are now posted immediately upon creation.
    This endpoint is kept for backward compatibility but returns the invoice as-is.
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
        
        # All invoices are now automatically posted, so just return the invoice
        serializer = StockInvoiceSerializer(stock_invoice)
        return APIResponse.success(
            data=serializer.data,
            message="Stock invoice already posted (all invoices are posted immediately)"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving stock invoice: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def parties_list(request):
    """
    Get simplified parties list for dropdowns and selection.
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company:
            return APIResponse.error(
                message="No company activated. Please activate a company first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        parties = Party.objects.filter(
            company=user_activity.current_company,
            is_active=True
        ).order_by('name')
        
        # Apply search filter if provided
        search_term = request.GET.get('search', '').strip()
        if search_term:
            parties = parties.filter(
                Q(name__icontains=search_term) |
                Q(contact_person__icontains=search_term) |
                Q(phone__icontains=search_term) |
                Q(email__icontains=search_term)
            )
        
        serializer = PartyListSerializer(parties, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Parties list retrieved successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found. Please activate a company first.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving parties list: {str(e)}",
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


@api_view(['GET'])
def stock_movement_report(request):
    """
    Generate stock movement report with optional grouping and filtering.
    Query parameters:
    - group_by: product|category|hs_code (default: product)
    - product_id: filter by specific product
    - category_id: filter by specific category
    - hs_code_id: filter by specific HS code
    - date_from: start date (YYYY-MM-DD)
    - date_to: end date (YYYY-MM-DD)
    - movement_type: filter by movement type
    - summary: true|false (return summary or detailed movements)
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company:
            return APIResponse.error(
                message="No company activated. Please activate a company first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize report generator
        report_generator = StockMovementReport(
            company=user_activity.current_company,
            financial_year=user_activity.current_financial_year
        )
        
        # Parse query parameters
        group_by = request.GET.get('group_by', 'product')
        product_id = request.GET.get('product_id')
        category_id = request.GET.get('category_id')
        hs_code_id = request.GET.get('hs_code_id')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        movement_type = request.GET.get('movement_type')
        is_summary = request.GET.get('summary', 'false').lower() == 'true'
        
        # Build filters
        filters = {}
        
        if product_id:
            try:
                product = Product.objects.get(id=product_id, company=user_activity.current_company)
                filters['product'] = product
            except Product.DoesNotExist:
                return APIResponse.error(
                    message="Product not found",
                    status_code=status.HTTP_404_NOT_FOUND
                )
        
        if category_id:
            try:
                category = Category.objects.get(id=category_id, company=user_activity.current_company)
                filters['category'] = category
            except Category.DoesNotExist:
                return APIResponse.error(
                    message="Category not found",
                    status_code=status.HTTP_404_NOT_FOUND
                )
        
        if hs_code_id:
            try:
                hs_code = HSCode.objects.get(id=hs_code_id, company=user_activity.current_company)
                filters['hs_code'] = hs_code
            except HSCode.DoesNotExist:
                return APIResponse.error(
                    message="HS Code not found",
                    status_code=status.HTTP_404_NOT_FOUND
                )
        
        if date_from:
            from datetime import datetime
            try:
                filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').date()
            except ValueError:
                return APIResponse.error(
                    message="Invalid date_from format. Use YYYY-MM-DD",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        
        if date_to:
            from datetime import datetime
            try:
                filters['date_to'] = datetime.strptime(date_to, '%Y-%m-%d').date()
            except ValueError:
                return APIResponse.error(
                    message="Invalid date_to format. Use YYYY-MM-DD",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        
        if movement_type:
            filters['movement_type'] = movement_type
        
        # Generate report
        if is_summary:
            report_data = report_generator.get_summary_report(group_by=group_by, **filters)
            # Convert summary to JSON-serializable format
            result = []
            for item in report_data:
                group = item['group']
                result.append({
                    'group_id': group.id if hasattr(group, 'id') else None,
                    'group_name': item['group_name'],
                    'group_type': group_by,
                    'total_quantity_in': float(item['total_quantity_in']),
                    'total_quantity_out': float(item['total_quantity_out']),
                    'net_quantity': float(item['net_quantity']),
                    'total_value_in': float(item['total_value_in']),
                    'total_value_out': float(item['total_value_out']),
                    'net_value': float(item['net_value']),
                    'total_gst_in': float(item['total_gst_in']),
                    'total_gst_out': float(item['total_gst_out']),
                    'net_gst': float(item['net_gst']),
                    'final_balance_quantity': float(item['final_balance_quantity']),
                    'final_balance_value': float(item['final_balance_value']),
                    'final_average_cost': float(item['final_average_cost']),
                    'movement_count': item['movement_count']
                })
        else:
            # Get detailed movements
            movements = report_generator.get_movements(**filters)
            result = []
            for movement in movements:
                result.append({
                    'id': movement.id,
                    'movement_date': movement.movement_date.isoformat(),
                    'movement_type': movement.movement_type,
                    'reference_number': movement.reference_number,
                    'product': {
                        'id': movement.product.id,
                        'code': movement.product.code,
                        'name': movement.product.name,
                        'category': {
                            'id': movement.product.category.id,
                            'name': movement.product.category.name,
                            'hs_code': {
                                'id': movement.product.category.hs_code.id,
                                'code': movement.product.category.hs_code.code,
                                'description': movement.product.category.hs_code.description
                            }
                        }
                    },
                    'quantity_in': float(movement.quantity_in),
                    'quantity_out': float(movement.quantity_out),
                    'balance_quantity': float(movement.balance_quantity),
                    'unit_cost': float(movement.unit_cost),
                    'average_cost': float(movement.average_cost),
                    'value_in': float(movement.value_in),
                    'value_out': float(movement.value_out),
                    'balance_value': float(movement.balance_value),
                    'gst_rate': float(movement.gst_rate),
                    'gst_amount_in': float(movement.gst_amount_in),
                    'gst_amount_out': float(movement.gst_amount_out),
                    'party': {
                        'id': movement.party.id,
                        'name': movement.party.name
                    } if movement.party else None
                })
        
        return APIResponse.success(
            data={
                'report_type': 'summary' if is_summary else 'detailed',
                'group_by': group_by,
                'filters_applied': filters,
                'total_records': len(result),
                'movements': result
            },
            message="Stock movement report generated successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found. Please activate a company first.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error generating stock movement report: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def stock_valuation_report(request):
    """
    Generate current stock valuation report using average cost method.
    Query parameters:
    - group_by: product|category|hs_code (default: product)
    - include_zero_stock: true|false (include products with zero stock)
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company:
            return APIResponse.error(
                message="No company activated. Please activate a company first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        group_by = request.GET.get('group_by', 'product')
        include_zero_stock = request.GET.get('include_zero_stock', 'false').lower() == 'true'
        
        # Get latest stock movements per product
        from django.db.models import Max, OuterRef, Subquery
        
        latest_movements = StockMovement.objects.filter(
            company=user_activity.current_company,
            product=OuterRef('product')
        ).order_by('-movement_date', '-created_at')
        
        # Get products with their latest stock information
        products_query = Product.objects.filter(
            company=user_activity.current_company,
            is_active=True
        ).select_related('category', 'category__hs_code')
        
        if not include_zero_stock:
            products_query = products_query.filter(current_stock__gt=0)
        
        result = []
        
        if group_by == 'product':
            for product in products_query:
                # Get latest movement for this product
                latest_movement = StockMovement.objects.filter(
                    company=user_activity.current_company,
                    product=product
                ).order_by('-movement_date', '-created_at').first()
                
                average_cost = latest_movement.average_cost if latest_movement else product.cost_price
                stock_value = product.current_stock * average_cost
                
                result.append({
                    'product_id': product.id,
                    'product_code': product.code,
                    'product_name': product.name,
                    'category_name': product.category.name,
                    'hs_code': product.category.hs_code.code,
                    'unit_of_measure': product.unit_of_measure,
                    'current_stock': float(product.current_stock),
                    'average_cost': float(average_cost),
                    'stock_value': float(stock_value),
                    'last_movement_date': latest_movement.movement_date.isoformat() if latest_movement else None
                })
        
        elif group_by == 'category':
            from collections import defaultdict
            category_data = defaultdict(lambda: {
                'total_stock_value': 0,
                'product_count': 0,
                'category_info': None
            })
            
            for product in products_query:
                latest_movement = StockMovement.objects.filter(
                    company=user_activity.current_company,
                    product=product
                ).order_by('-movement_date', '-created_at').first()
                
                average_cost = latest_movement.average_cost if latest_movement else product.cost_price
                stock_value = product.current_stock * average_cost
                
                category_data[product.category]['total_stock_value'] += stock_value
                category_data[product.category]['product_count'] += 1
                category_data[product.category]['category_info'] = product.category
            
            for category, data in category_data.items():
                result.append({
                    'category_id': category.id,
                    'category_name': category.name,
                    'hs_code': category.hs_code.code,
                    'product_count': data['product_count'],
                    'total_stock_value': float(data['total_stock_value'])
                })
        
        elif group_by == 'hs_code':
            from collections import defaultdict
            hs_code_data = defaultdict(lambda: {
                'total_stock_value': 0,
                'product_count': 0,
                'hs_code_info': None
            })
            
            for product in products_query:
                latest_movement = StockMovement.objects.filter(
                    company=user_activity.current_company,
                    product=product
                ).order_by('-movement_date', '-created_at').first()
                
                average_cost = latest_movement.average_cost if latest_movement else product.cost_price
                stock_value = product.current_stock * average_cost
                
                hs_code = product.category.hs_code
                hs_code_data[hs_code]['total_stock_value'] += stock_value
                hs_code_data[hs_code]['product_count'] += 1
                hs_code_data[hs_code]['hs_code_info'] = hs_code
            
            for hs_code, data in hs_code_data.items():
                result.append({
                    'hs_code_id': hs_code.id,
                    'hs_code': hs_code.code,
                    'hs_description': hs_code.description,
                    'product_count': data['product_count'],
                    'total_stock_value': float(data['total_stock_value'])
                })
        
        # Calculate totals
        total_value = sum(item.get('stock_value', item.get('total_stock_value', 0)) for item in result)
        
        return APIResponse.success(
            data={
                'report_type': 'stock_valuation',
                'group_by': group_by,
                'include_zero_stock': include_zero_stock,
                'total_records': len(result),
                'total_stock_value': float(total_value),
                'items': result
            },
            message="Stock valuation report generated successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found. Please activate a company first.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error generating stock valuation report: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )