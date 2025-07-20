from rest_framework import serializers
from decimal import Decimal
from .models import Party, HSCode, Category, Product, StockInvoice, StockInvoiceLineItem
from common.models import UserActivity


class PartySerializer(serializers.ModelSerializer):
    """
    Serializer for Party model.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    party_type_display = serializers.CharField(source='get_party_type_display', read_only=True)
    
    class Meta:
        model = Party
        fields = [
            'id', 'company', 'company_name', 'name', 'party_type', 'party_type_display',
            'contact_person', 'phone', 'email', 'address_line_1', 'address_line_2',
            'city', 'postal_code', 'ntn', 'strn', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        return attrs


class PartyListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for party list in dropdowns.
    """
    party_type_display = serializers.CharField(source='get_party_type_display', read_only=True)
    
    class Meta:
        model = Party
        fields = ['id', 'name', 'party_type', 'party_type_display', 'phone', 'email']


class HSCodeSerializer(serializers.ModelSerializer):
    """
    Serializer for HSCode model.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    categories_count = serializers.SerializerMethodField()
    
    class Meta:
        model = HSCode
        fields = [
            'id', 'company', 'company_name', 'code', 'description', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at', 'categories_count'
        ]
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at']
    
    def get_categories_count(self, obj):
        return obj.categories.filter(is_active=True).count()
    
    def validate(self, attrs):
        # Basic validation - company and created_by are handled in the view
        return attrs


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    hs_code_display = serializers.CharField(source='hs_code.__str__', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'company', 'company_name', 'hs_code', 'hs_code_display', 'name', 
            'description', 'is_active', 'created_by', 'created_by_name', 
            'created_at', 'updated_at', 'products_count'
        ]
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at']
    
    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()
    
    def validate(self, attrs):
        # Validate HS Code belongs to current company
        user = self.context['request'].user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise serializers.ValidationError(
                    'No company activated. Please activate a company first.'
                )
            
            hs_code = attrs.get('hs_code')
            if hs_code and hs_code.company != user_activity.current_company:
                raise serializers.ValidationError({
                    'hs_code': 'HS Code must belong to the same company.'
                })
                
        except UserActivity.DoesNotExist:
            raise serializers.ValidationError(
                'User activity not found. Please activate a company first.'
            )
        
        return attrs


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_display = serializers.CharField(source='category.__str__', read_only=True)
    unit_of_measure_display = serializers.CharField(source='get_unit_of_measure_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'company', 'company_name', 'category', 'category_display', 'code', 'name', 
            'description', 'unit_of_measure', 'unit_of_measure_display', 'barcode',
            'cost_price', 'selling_price', 'current_stock', 'minimum_stock', 'maximum_stock',
            'gst_rate', 'is_active', 'is_low_stock', 'stock_value',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company', 'current_stock', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        # Validate category belongs to current company
        user = self.context['request'].user
        try:
            user_activity = UserActivity.objects.get(user=user)
            if not user_activity.current_company:
                raise serializers.ValidationError(
                    'No company activated. Please activate a company first.'
                )
            
            category = attrs.get('category')
            if category and category.company != user_activity.current_company:
                raise serializers.ValidationError({
                    'category': 'Category must belong to the same company.'
                })
                
        except UserActivity.DoesNotExist:
            raise serializers.ValidationError(
                'User activity not found. Please activate a company first.'
            )
        
        return attrs


class StockInvoiceLineItemSerializer(serializers.ModelSerializer):
    """
    Serializer for StockInvoiceLineItem model.
    """
    product_code = serializers.CharField(source='product.code', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_unit = serializers.CharField(source='product.unit_of_measure', read_only=True)
    total_with_gst = serializers.ReadOnlyField()
    
    class Meta:
        model = StockInvoiceLineItem
        fields = [
            'id', 'product', 'product_code', 'product_name', 'product_unit',
            'serial_number', 'quantity', 'unit_price', 'amount_ex_gst', 'gst_rate', 
            'gst_value', 'amount_inc_gst', 'total_value', 'gst_amount',
            'total_with_gst', 'description', 'line_number', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'line_number', 'amount_ex_gst', 'amount_inc_gst', 'total_value', 
            'gst_amount', 'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        quantity = attrs.get('quantity', Decimal('0'))
        unit_price = attrs.get('unit_price', Decimal('0'))
        gst_rate = attrs.get('gst_rate', Decimal('0'))
        
        # Validate positive values
        if quantity <= 0:
            raise serializers.ValidationError({
                'quantity': 'Quantity must be greater than 0.'
            })
        
        if unit_price < 0:
            raise serializers.ValidationError({
                'unit_price': 'Unit price cannot be negative.'
            })
        
        if gst_rate < 0 or gst_rate > 100:
            raise serializers.ValidationError({
                'gst_rate': 'GST rate must be between 0 and 100.'
            })
        
        return attrs


class StockInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for StockInvoice model with nested line items.
    """
    line_items = StockInvoiceLineItemSerializer(many=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    financial_year_name = serializers.CharField(source='financial_year.name', read_only=True)
    party_name = serializers.CharField(source='party.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    
    class Meta:
        model = StockInvoice
        fields = [
            'id', 'company', 'company_name', 'financial_year', 'financial_year_name',
            'invoice_type', 'invoice_type_display', 'invoice_number', 'invoice_date',
            'party', 'party_name', 'party_address', 'party_contact', 'reference_number',
            'subtotal', 'total_gst', 'total_amount', 'notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at', 'line_items'
        ]
        read_only_fields = [
            'id', 'company', 'financial_year', 'invoice_number', 'subtotal', 'total_gst', 'total_amount',
            'created_by', 'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        user = self.context['request'].user
        
        # Get user's current activity for validation
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
                
        except UserActivity.DoesNotExist:
            raise serializers.ValidationError(
                'User activity not found. Please activate a company and financial year first.'
            )
        
        # Validate line items
        line_items_data = attrs.get('line_items', [])
        if len(line_items_data) < 1:
            raise serializers.ValidationError({
                'line_items': 'Stock invoice must have at least 1 line item.'
            })
        
        # Validate all products belong to current company
        for item_data in line_items_data:
            product = item_data.get('product')
            if product and product.company != user_activity.current_company:
                raise serializers.ValidationError({
                    'line_items': f'Product {product.code} - {product.name} does not belong to the current company.'
                })
        
        return attrs
    
    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items')
        validated_data['created_by'] = self.context['request'].user
        
        stock_invoice = StockInvoice.objects.create(**validated_data)
        
        # Create line items
        for line_item_data in line_items_data:
            StockInvoiceLineItem.objects.create(stock_invoice=stock_invoice, **line_item_data)
        
        return stock_invoice
    
    def update(self, instance, validated_data):
        # Only allow editing if status is draft
        if instance.status != 'draft':
            raise serializers.ValidationError(
                'Only draft invoices can be edited.'
            )
        
        line_items_data = validated_data.pop('line_items', None)
        
        # Update invoice fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update line items if provided
        if line_items_data is not None:
            # Delete existing line items
            instance.line_items.all().delete()
            
            # Create new line items
            for line_item_data in line_items_data:
                StockInvoiceLineItem.objects.create(stock_invoice=instance, **line_item_data)
        
        return instance


class StockInvoiceListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for stock invoice list view.
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    financial_year_name = serializers.CharField(source='financial_year.name', read_only=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    line_items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = StockInvoice
        fields = [
            'id', 'invoice_number', 'invoice_type', 'invoice_type_display',
            'invoice_date', 'party_name', 'total_amount', 'status', 'status_display',
            'company_name', 'financial_year_name', 'line_items_count', 'created_at'
        ]
    
    def get_line_items_count(self, obj):
        return obj.line_items.count()


class ProductListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for product list in dropdowns.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_of_measure_display = serializers.CharField(source='get_unit_of_measure_display', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'code', 'name', 'category_name', 'unit_of_measure', 
            'unit_of_measure_display', 'current_stock', 'cost_price', 'selling_price'
        ]