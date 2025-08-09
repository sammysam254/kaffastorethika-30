import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  companyInfo: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 5,
    color: '#666666',
  },
  receiptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  infoSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingBottom: 2,
  },
  infoText: {
    fontSize: 10,
    marginBottom: 2,
    color: '#555555',
  },
  table: {
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingBottom: 5,
    paddingTop: 5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f4',
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
    paddingBottom: 8,
    paddingTop: 8,
    marginBottom: 5,
  },
  tableCell: {
    fontSize: 10,
    padding: 2,
  },
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    padding: 2,
  },
  productName: {
    width: '40%',
  },
  quantity: {
    width: '15%',
    textAlign: 'center',
  },
  price: {
    width: '20%',
    textAlign: 'right',
  },
  total: {
    width: '25%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    borderTopWidth: 2,
    borderTopColor: '#000000',
    paddingTop: 5,
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    paddingTop: 15,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 10,
    color: '#666666',
  },
  paymentInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 5,
  },
  paymentConfirmed: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d5a2d',
    textAlign: 'center',
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
    color: '#888888',
    textAlign: 'center',
  },
});

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  total_amount: number;
  shipping_fee?: number;
  voucher_discount?: number;
  payment_method?: string;
  status: string;
  created_at: string;
  quantity: number;
  product_id?: string;
  products?: {
    id: string;
    name: string;
    price: number;
    category: string;
  };
}

interface ReceiptDocumentProps {
  order: Order;
  paymentConfirmationNumber?: string;
  productInfo?: {
    name: string;
    price: number;
    category: string;
  };
}

// PDF Document Component
const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({ order, paymentConfirmationNumber, productInfo }) => {
  // Use productInfo if available, otherwise fall back to order.products
  const product = productInfo || order.products;
  const unitPrice = product?.price || (order.total_amount - (order.shipping_fee || 0) + (order.voucher_discount || 0)) / order.quantity;
  const subtotal = unitPrice * order.quantity;
  const shipping = order.shipping_fee || 0;
  const discount = order.voucher_discount || 0;
  const finalTotal = order.total_amount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Logo centered at top */}
          <View style={{ alignItems: 'center', marginBottom: 15 }}>
            <Image 
              src="/lovable-uploads/e047520e-19b1-47f7-8286-99901fcfc9ab.png"
              style={{ width: 60, height: 60 }}
            />
          </View>
          
          {/* Company name and details */}
          <Text style={styles.title}>KAFFA ONLINE STORE</Text>
          <Text style={styles.companyInfo}>Thika Town, Kenya</Text>
          <Text style={styles.companyInfo}>Phone: +254743049549 | Email: masterkaffa762@gmail.com</Text>
          <View style={{ borderBottomWidth: 2, borderBottomColor: '#000000', marginTop: 10 }}>
            <Text style={[styles.title, { fontSize: 18, marginBottom: 5 }]}>SALES RECEIPT</Text>
          </View>
        </View>

        {/* Receipt Info */}
        <View style={styles.receiptInfo}>
          <View>
            <Text style={styles.infoText}>Receipt #: {order.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.infoText}>Date: {new Date(order.created_at).toLocaleDateString()}</Text>
            <Text style={styles.infoText}>Time: {new Date(order.created_at).toLocaleTimeString()}</Text>
          </View>
          <View>
            <Text style={styles.infoText}>Payment Method: {order.payment_method?.toUpperCase() || 'N/A'}</Text>
            <Text style={styles.infoText}>Status: {order.status.toUpperCase()}</Text>
            {paymentConfirmationNumber && (
              <Text style={styles.infoText}>M-Pesa Code: {paymentConfirmationNumber}</Text>
            )}
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
          <Text style={styles.infoText}>Name: {order.customer_name}</Text>
          <Text style={styles.infoText}>Email: {order.customer_email}</Text>
          {order.customer_phone && (
            <Text style={styles.infoText}>Phone: {order.customer_phone}</Text>
          )}
        </View>

        {/* Shipping Address */}
        {order.shipping_address && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>SHIPPING ADDRESS</Text>
            <Text style={styles.infoText}>{order.shipping_address}</Text>
          </View>
        )}

        {/* Products Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>ITEMS PURCHASED</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCellHeader, styles.productName]}>Item Name</Text>
            <Text style={[styles.tableCellHeader, styles.quantity]}>Qty</Text>
            <Text style={[styles.tableCellHeader, styles.price]}>Price per Item</Text>
            <Text style={[styles.tableCellHeader, styles.total]}>Total Price</Text>
          </View>

          {/* Product Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.productName]}>
              {product?.name || 'Product Not Available'}
              {product?.category && (
                <Text style={{ fontSize: 8, color: '#888888' }}>
                  {'\n'}Category: {product.category}
                </Text>
              )}
            </Text>
            <Text style={[styles.tableCell, styles.quantity]}>{order.quantity}</Text>
            <Text style={[styles.tableCell, styles.price]}>
              KES {unitPrice.toLocaleString()}
            </Text>
            <Text style={[styles.tableCell, styles.total]}>
              KES {subtotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalAmount}>KES {subtotal.toLocaleString()}</Text>
          </View>
          
          {shipping > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping:</Text>
              <Text style={styles.totalAmount}>KES {shipping.toLocaleString()}</Text>
            </View>
          )}
          
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalAmount}>-KES {discount.toLocaleString()}</Text>
            </View>
          )}
          
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalAmount}>KES {finalTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Confirmation */}
        {paymentConfirmationNumber && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentConfirmed}>
              ✓ PAYMENT CONFIRMED
            </Text>
            <Text style={[styles.infoText, { textAlign: 'center', marginTop: 5 }]}>
              M-Pesa Confirmation Code: {paymentConfirmationNumber}
            </Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Date Received</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.notes}>
            Thank you for your business! For any inquiries, please contact us at the above information.
          </Text>
          <Text style={styles.notes}>
            This receipt serves as proof of purchase. Please keep for your records.
          </Text>
          <Text style={[styles.notes, { marginTop: 10, fontWeight: 'bold' }]}>
            Generated on: {new Date().toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

interface ReceiptGeneratorProps {
  order: Order;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ order }) => {
  const [mpesaCode, setMpesaCode] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<{name: string; price: number; category: string} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        // Fetch M-Pesa code if payment method is mpesa
        if (order.payment_method === 'mpesa') {
          const { data: mpesaData, error: mpesaError } = await supabase
            .from('mpesa_payments')
            .select('mpesa_code')
            .eq('order_id', order.id)
            .maybeSingle();
          
          if (mpesaError) {
            console.error('Error fetching M-Pesa code:', mpesaError);
          } else if (mpesaData?.mpesa_code) {
            setMpesaCode(mpesaData.mpesa_code);
          }
        }

        // Fetch product information if product_id exists
        if (order.product_id) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('name, price, category')
            .eq('id', order.product_id)
            .maybeSingle();
          
          if (productError) {
            console.error('Error fetching product info:', productError);
          } else if (productData) {
            setProductInfo(productData);
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [order.id, order.payment_method, order.product_id]);

  const fileName = `receipt-${order.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <ReceiptDocument 
          order={order} 
          paymentConfirmationNumber={mpesaCode || undefined}
          productInfo={productInfo || undefined}
        />
      }
      fileName={fileName}
    >
      {({ blob, url, loading: pdfLoading, error }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading || pdfLoading}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>{loading || pdfLoading ? 'Generating...' : 'Download Receipt'}</span>
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default ReceiptGenerator;