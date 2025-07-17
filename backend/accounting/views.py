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
    filterset_fields = ['account_type', 'is_group_account', 'is_active', 'parent']
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
    filterset_fields = ['voucher_type', 'voucher_date']
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
                'company', 'financial_year', 'created_by'
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
                'company', 'financial_year', 'created_by'
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


@api_view(['GET'])
def trial_balance(request):
    """
    Generate hierarchical trial balance with opening, current period, and closing balances.
    Query parameters:
    - from_date: Start date for current period transactions (default: financial year start)
    - to_date: End date for current period transactions (default: current date)
    """
    try:
        from django.db.models import Sum, Q, Case, When, DecimalField
        from decimal import Decimal
        from datetime import date
        
        user = request.user
        user_activity = UserActivity.objects.get(user=user)
        
        if not user_activity.current_company:
            return APIResponse.error(
                message="No company activated. Please activate a company first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not user_activity.current_financial_year:
            return APIResponse.error(
                message="No financial year activated. Please activate a financial year first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        company = user_activity.current_company
        financial_year = user_activity.current_financial_year
        
        # Parse query parameters
        from_date = request.GET.get('from_date')
        to_date = request.GET.get('to_date')
        
        # Set default dates
        if from_date:
            from_date = date.fromisoformat(from_date)
        else:
            from_date = financial_year.start_date
        
        if to_date:
            to_date = date.fromisoformat(to_date)
        else:
            to_date = date.today()
        
        # Validate date range
        if from_date > to_date:
            return APIResponse.error(
                message="From date cannot be later than to date",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all accounts for the company
        accounts = ChartOfAccounts.objects.filter(
            company=company,
            is_active=True
        ).select_related('parent').order_by('code')
        
        # Calculate balances for each account
        account_data_map = {}
        
        for account in accounts:
            # Calculate opening balance (transactions before from_date)
            opening_entries = VoucherLineEntry.objects.filter(
                account=account,
                voucher__company=company,
                voucher__financial_year=financial_year,
                voucher__voucher_date__lt=from_date
            ).aggregate(
                total_debit=Sum('debit_amount', default=Decimal('0')),
                total_credit=Sum('credit_amount', default=Decimal('0'))
            )
            
            opening_debit = opening_entries['total_debit'] or Decimal('0')
            opening_credit = opening_entries['total_credit'] or Decimal('0')
            
            # Calculate current period transactions (from_date to to_date)
            current_entries = VoucherLineEntry.objects.filter(
                account=account,
                voucher__company=company,
                voucher__financial_year=financial_year,
                voucher__voucher_date__gte=from_date,
                voucher__voucher_date__lte=to_date
            ).aggregate(
                total_debit=Sum('debit_amount', default=Decimal('0')),
                total_credit=Sum('credit_amount', default=Decimal('0'))
            )
            
            current_debit = current_entries['total_debit'] or Decimal('0')
            current_credit = current_entries['total_credit'] or Decimal('0')
            
            # Calculate closing balance
            closing_debit = opening_debit + current_debit
            closing_credit = opening_credit + current_credit
            
            # Store all account data (we'll filter later after building hierarchy)
            account_data_map[account.id] = {
                'id': account.id,
                'code': account.code,
                'name': account.name,
                'account_type': account.account_type,
                'account_type_display': account.get_account_type_display(),
                'is_group_account': account.is_group_account,
                'parent_id': account.parent_id,
                'parent_code': account.parent.code if account.parent else None,
                'parent_name': account.parent.name if account.parent else None,
                'level': account.level,
                'opening_debit': float(opening_debit),
                'opening_credit': float(opening_credit),
                'current_debit': float(current_debit),
                'current_credit': float(current_credit),
                'closing_debit': float(closing_debit),
                'closing_credit': float(closing_credit),
                'opening_balance': float(opening_debit - opening_credit),
                'current_balance': float(current_debit - current_credit),
                'closing_balance': float(closing_debit - closing_credit),
                'has_activity': (opening_debit > 0 or opening_credit > 0 or 
                               current_debit > 0 or current_credit > 0 or
                               closing_debit > 0 or closing_credit > 0)
            }
        
        # Build hierarchical structure and filter accounts with activity
        def build_hierarchy(parent_id=None):
            hierarchy = []
            # Get all accounts with this parent
            children_accounts = [acc for acc in account_data_map.values() if acc['parent_id'] == parent_id]
            
            for account_data in children_accounts:
                # Get children recursively
                children = build_hierarchy(account_data['id'])
                
                # Check if this account should be included
                should_include = account_data['has_activity'] or len(children) > 0
                
                if should_include:
                    # Calculate totals if this is a group account with children
                    if account_data['is_group_account'] and children:
                        # Sum up children's balances
                        for field in ['opening_debit', 'opening_credit', 'current_debit', 
                                     'current_credit', 'closing_debit', 'closing_credit']:
                            account_data[field] = sum(child[field] for child in children)
                        
                        # Recalculate balance fields
                        account_data['opening_balance'] = account_data['opening_debit'] - account_data['opening_credit']
                        account_data['current_balance'] = account_data['current_debit'] - account_data['current_credit']
                        account_data['closing_balance'] = account_data['closing_debit'] - account_data['closing_credit']
                    
                    account_data['children'] = children
                    hierarchy.append(account_data)
            
            return hierarchy
        
        hierarchical_data = build_hierarchy()
        
        # Calculate grand totals from root level accounts
        grand_totals = {
            'opening_debit': sum(acc['opening_debit'] for acc in hierarchical_data),
            'opening_credit': sum(acc['opening_credit'] for acc in hierarchical_data),
            'current_debit': sum(acc['current_debit'] for acc in hierarchical_data),
            'current_credit': sum(acc['current_credit'] for acc in hierarchical_data),
            'closing_debit': sum(acc['closing_debit'] for acc in hierarchical_data),
            'closing_credit': sum(acc['closing_credit'] for acc in hierarchical_data)
        }
        
        response_data = {
            'trial_balance': hierarchical_data,
            'totals': grand_totals,
            'meta': {
                'company_name': company.name,
                'financial_year': financial_year.name,
                'from_date': from_date.isoformat(),
                'to_date': to_date.isoformat(),
                'generated_at': date.today().isoformat()
            }
        }
        
        return APIResponse.success(
            data=response_data,
            message="Trial balance generated successfully"
        )
    
    except UserActivity.DoesNotExist:
        return APIResponse.error(
            message="User activity not found. Please activate a company and financial year first.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except ValueError as e:
        return APIResponse.error(
            message=f"Invalid date format: {str(e)}",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Error generating trial balance: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
