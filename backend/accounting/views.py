from rest_framework import generics, status, filters
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from common.utils import APIResponse
from common.models import UserActivity
from .models import ChartOfAccounts, Voucher, VoucherLineEntry
from .serializers import (
    ChartOfAccountsSerializer, ChartOfAccountsHierarchySerializer,
    VoucherSerializer, VoucherListSerializer, VoucherLineEntrySerializer
)


class ChartOfAccountsListCreateView(generics.ListCreateAPIView):
    """
    List all chart of accounts or create a new account.
    Filters by current user's activated company.
    """
    serializer_class = ChartOfAccountsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['account_type', 'is_control_account', 'is_active', 'parent']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['code']
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return ChartOfAccounts.objects.none()
            
            return ChartOfAccounts.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'parent', 'created_by')
        except UserActivity.DoesNotExist:
            return ChartOfAccounts.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Chart of accounts retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving chart of accounts: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Chart of account created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error creating chart of account: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class ChartOfAccountsDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a chart of account.
    """
    serializer_class = ChartOfAccountsSerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                return ChartOfAccounts.objects.none()
            
            return ChartOfAccounts.objects.filter(
                company=user_activity.current_company
            ).select_related('company', 'parent', 'created_by')
        except UserActivity.DoesNotExist:
            return ChartOfAccounts.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Chart of account retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving chart of account: {str(e)}",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Chart of account updated successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error updating chart of account: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            can_delete, message = instance.can_be_deleted()
            if not can_delete:
                return APIResponse.error(
                    message=message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            super().destroy(request, *args, **kwargs)
            return APIResponse.success(
                message="Chart of account deleted successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error deleting chart of account: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
def chart_of_accounts_hierarchy(request):
    """
    Get chart of accounts in hierarchical structure.
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company:
            return APIResponse.error(
                message="No company activated. Please activate a company first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        account_type = request.GET.get('account_type')
        hierarchy = ChartOfAccounts.get_account_hierarchy(
            company=user_activity.current_company,
            account_type=account_type
        )
        
        # Serialize the hierarchy
        serialized_hierarchy = []
        for node in hierarchy:
            account_data = ChartOfAccountsHierarchySerializer(node['account']).data
            account_data['children'] = _serialize_hierarchy_children(node['children'])
            serialized_hierarchy.append(account_data)
        
        return APIResponse.success(
            data=serialized_hierarchy,
            message="Chart of accounts hierarchy retrieved successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found. Please activate a company first.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving hierarchy: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _serialize_hierarchy_children(children):
    """Helper function to recursively serialize hierarchy children."""
    serialized_children = []
    for child_node in children:
        child_data = ChartOfAccountsHierarchySerializer(child_node['account']).data
        child_data['children'] = _serialize_hierarchy_children(child_node['children'])
        serialized_children.append(child_data)
    return serialized_children


class VoucherListCreateView(generics.ListCreateAPIView):
    """
    List all vouchers or create a new voucher.
    Filters by current user's activated company and financial year.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['voucher_type', 'is_posted', 'is_approved', 'voucher_date']
    search_fields = ['voucher_number', 'narration', 'reference']
    ordering_fields = ['voucher_date', 'voucher_number', 'created_at']
    ordering = ['-voucher_date', '-voucher_number']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return VoucherListSerializer
        return VoucherSerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company or not user_activity.current_financial_year:
                return Voucher.objects.none()
            
            return Voucher.objects.filter(
                company=user_activity.current_company,
                financial_year=user_activity.current_financial_year
            ).select_related(
                'company', 'financial_year', 'created_by', 'approved_by'
            ).prefetch_related('line_entries__account')
        except UserActivity.DoesNotExist:
            return Voucher.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Vouchers retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving vouchers: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Voucher created successfully",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error creating voucher: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class VoucherDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a voucher.
    """
    serializer_class = VoucherSerializer
    
    def get_queryset(self):
        user = self.request.user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company or not user_activity.current_financial_year:
                return Voucher.objects.none()
            
            return Voucher.objects.filter(
                company=user_activity.current_company,
                financial_year=user_activity.current_financial_year
            ).select_related(
                'company', 'financial_year', 'created_by', 'approved_by'
            ).prefetch_related('line_entries__account')
        except UserActivity.DoesNotExist:
            return Voucher.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Voucher retrieved successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error retrieving voucher: {str(e)}",
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return APIResponse.success(
                data=response.data,
                message="Voucher updated successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error updating voucher: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            can_delete, message = instance.can_be_deleted()
            if not can_delete:
                return APIResponse.error(
                    message=message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            super().destroy(request, *args, **kwargs)
            return APIResponse.success(
                message="Voucher deleted successfully"
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Error deleting voucher: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
def post_voucher(request, pk):
    """
    Post a voucher (mark as posted and approved).
    """
    try:
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company or not user_activity.current_financial_year:
            return APIResponse.error(
                message="No company or financial year activated.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        voucher = Voucher.objects.get(
            pk=pk,
            company=user_activity.current_company,
            financial_year=user_activity.current_financial_year
        )
        
        voucher.post_voucher(user)
        
        serializer = VoucherSerializer(voucher)
        return APIResponse.success(
            data=serializer.data,
            message="Voucher posted successfully"
        )
    
    except Voucher.DoesNotExist:
        return APIResponse.error(
            message="Voucher not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error posting voucher: {str(e)}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
def voucher_types(request):
    """
    Get available voucher types.
    """
    try:
        types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Voucher.VOUCHER_TYPES
        ]
        return APIResponse.success(
            data=types,
            message="Voucher types retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving voucher types: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def account_types(request):
    """
    Get available account types.
    """
    try:
        types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in ChartOfAccounts.ACCOUNT_TYPES
        ]
        return APIResponse.success(
            data=types,
            message="Account types retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error retrieving account types: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
