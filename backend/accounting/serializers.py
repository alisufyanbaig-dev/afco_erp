from rest_framework import serializers
from decimal import Decimal
from .models import ChartOfAccounts, Voucher, VoucherLineEntry
from common.models import UserActivity


class ChartOfAccountsSerializer(serializers.ModelSerializer):
    """
    Serializer for ChartOfAccounts model with hierarchical display.
    """
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    parent_code = serializers.CharField(source='parent.code', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    level = serializers.ReadOnlyField()
    full_path = serializers.ReadOnlyField()
    
    class Meta:
        model = ChartOfAccounts
        fields = [
            'id', 'company', 'company_name', 'code', 'name', 'account_type', 
            'account_type_display', 'parent', 'parent_name', 'parent_code',
            'is_group_account', 'is_active', 'description', 'level', 'full_path',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        user = self.context['request'].user
        
        # Get user's current activity
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise serializers.ValidationError(
                    'No company activated. Please activate a company first.'
                )
            
            # Set company from user activity if not provided
            if 'company' not in attrs:
                attrs['company'] = user_activity.current_company
            elif attrs['company'] != user_activity.current_company:
                raise serializers.ValidationError({
                    'company': 'Account must belong to the currently activated company.'
                })
                
        except UserActivity.DoesNotExist:
            raise serializers.ValidationError(
                'User activity not found. Please activate a company first.'
            )
        
        return attrs
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ChartOfAccountsHierarchySerializer(serializers.ModelSerializer):
    """
    Serializer for displaying chart of accounts in hierarchical structure.
    """
    children = serializers.SerializerMethodField()
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    
    class Meta:
        model = ChartOfAccounts
        fields = [
            'id', 'code', 'name', 'account_type', 'account_type_display',
            'is_group_account', 'is_active', 'children'
        ]
    
    def get_children(self, obj):
        if obj.is_group_account:
            children = obj.get_children()
            return ChartOfAccountsHierarchySerializer(children, many=True).data
        return []


class VoucherLineEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for VoucherLineEntry model.
    """
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    amount = serializers.ReadOnlyField()
    entry_type = serializers.ReadOnlyField()
    
    class Meta:
        model = VoucherLineEntry
        fields = [
            'id', 'account', 'account_code', 'account_name', 'debit_amount', 
            'credit_amount', 'amount', 'entry_type', 'description', 'line_number',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'line_number', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        debit_amount = attrs.get('debit_amount', Decimal('0'))
        credit_amount = attrs.get('credit_amount', Decimal('0'))
        
        # Ensure exactly one of debit or credit is non-zero
        if debit_amount > 0 and credit_amount > 0:
            raise serializers.ValidationError(
                'Line entry cannot have both debit and credit amounts.'
            )
        
        if debit_amount == 0 and credit_amount == 0:
            raise serializers.ValidationError(
                'Line entry must have either debit or credit amount.'
            )
        
        return attrs


class VoucherSerializer(serializers.ModelSerializer):
    """
    Serializer for Voucher model with nested line entries.
    """
    line_entries = VoucherLineEntrySerializer(many=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    financial_year_name = serializers.CharField(source='financial_year.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    voucher_type_display = serializers.CharField(source='get_voucher_type_display', read_only=True)
    total_debit = serializers.ReadOnlyField()
    total_credit = serializers.ReadOnlyField()
    is_balanced = serializers.ReadOnlyField()
    
    class Meta:
        model = Voucher
        fields = [
            'id', 'company', 'company_name', 'financial_year', 'financial_year_name',
            'voucher_type', 'voucher_type_display', 'voucher_number', 'voucher_date',
            'narration', 'reference', 'is_posted', 'is_approved', 'total_debit',
            'total_credit', 'is_balanced', 'created_by', 'created_by_name',
            'approved_by', 'approved_by_name', 'created_at', 'updated_at',
            'line_entries'
        ]
        read_only_fields = [
            'id', 'voucher_number', 'created_by', 'approved_by', 
            'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        user = self.context['request'].user
        
        # Get user's current activity
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise serializers.ValidationError(
                    'No company activated. Please activate a company first.'
                )
            if not user_activity.current_financial_year:
                raise serializers.ValidationError(
                    'No financial year activated. Please activate a financial year first.'
                )
            
            # Set company and financial year from user activity if not provided
            if 'company' not in attrs:
                attrs['company'] = user_activity.current_company
            elif attrs['company'] != user_activity.current_company:
                raise serializers.ValidationError({
                    'company': 'Voucher must belong to the currently activated company.'
                })
            
            if 'financial_year' not in attrs:
                attrs['financial_year'] = user_activity.current_financial_year
            elif attrs['financial_year'] != user_activity.current_financial_year:
                raise serializers.ValidationError({
                    'financial_year': 'Voucher must belong to the currently activated financial year.'
                })
                
        except UserActivity.DoesNotExist:
            raise serializers.ValidationError(
                'User activity not found. Please activate a company and financial year first.'
            )
        
        # Validate voucher date is within financial year
        voucher_date = attrs.get('voucher_date')
        financial_year = attrs.get('financial_year')
        if voucher_date and financial_year:
            if not (financial_year.start_date <= voucher_date <= financial_year.end_date):
                raise serializers.ValidationError({
                    'voucher_date': f'Voucher date must be between {financial_year.start_date} and {financial_year.end_date}.'
                })
        
        # Validate line entries
        line_entries_data = attrs.get('line_entries', [])
        if len(line_entries_data) < 2:
            raise serializers.ValidationError({
                'line_entries': 'Voucher must have at least 2 line entries.'
            })
        
        # Calculate totals and validate balance
        total_debit = sum(
            entry.get('debit_amount', Decimal('0')) 
            for entry in line_entries_data
        )
        total_credit = sum(
            entry.get('credit_amount', Decimal('0')) 
            for entry in line_entries_data
        )
        
        if total_debit != total_credit:
            raise serializers.ValidationError({
                'line_entries': f'Voucher is not balanced. Total debit: {total_debit}, Total credit: {total_credit}'
            })
        
        # Validate all accounts belong to same company
        company = attrs.get('company')
        for entry_data in line_entries_data:
            account = entry_data.get('account')
            if account and account.company != company:
                raise serializers.ValidationError({
                    'line_entries': f'Account {account.code} - {account.name} does not belong to the voucher company.'
                })
            
            # Check if account is group account
            if account and account.is_group_account:
                raise serializers.ValidationError({
                    'line_entries': f'Cannot post entries to group account {account.code} - {account.name}.'
                })
        
        return attrs
    
    def create(self, validated_data):
        line_entries_data = validated_data.pop('line_entries')
        validated_data['created_by'] = self.context['request'].user
        
        voucher = Voucher.objects.create(**validated_data)
        
        # Create line entries
        for line_entry_data in line_entries_data:
            VoucherLineEntry.objects.create(voucher=voucher, **line_entry_data)
        
        return voucher
    
    def update(self, instance, validated_data):
        # Check if voucher can be edited
        can_edit, message = instance.can_be_edited()
        if not can_edit:
            raise serializers.ValidationError(message)
        
        line_entries_data = validated_data.pop('line_entries', None)
        
        # Update voucher fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update line entries if provided
        if line_entries_data is not None:
            # Delete existing line entries
            instance.line_entries.all().delete()
            
            # Create new line entries
            for line_entry_data in line_entries_data:
                VoucherLineEntry.objects.create(voucher=instance, **line_entry_data)
        
        return instance


class VoucherListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for voucher list view.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    financial_year_name = serializers.CharField(source='financial_year.name', read_only=True)
    voucher_type_display = serializers.CharField(source='get_voucher_type_display', read_only=True)
    total_debit = serializers.ReadOnlyField()
    total_credit = serializers.ReadOnlyField()
    is_balanced = serializers.ReadOnlyField()
    line_entries_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Voucher
        fields = [
            'id', 'voucher_number', 'voucher_type', 'voucher_type_display',
            'voucher_date', 'narration', 'total_debit', 'total_credit',
            'is_balanced', 'is_posted', 'is_approved', 'company_name',
            'financial_year_name', 'line_entries_count', 'created_at'
        ]
    
    def get_line_entries_count(self, obj):
        return obj.line_entries.count()