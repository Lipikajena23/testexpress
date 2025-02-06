import db from '../config/db.js';

class ReportsController {
    static async getGeneralBriefReport(req, res) {
        const { restaurantId } = req.body;
        try {
            const generalBriefQuery = `
    SELECT 
        SUM(CASE WHEN order_status = 'Completed' THEN amount ELSE 0 END) AS total_sales,
        SUM(CASE WHEN order_status = 'Completed' THEN grand_total ELSE 0 END) AS total_payments_received,
        SUM(CASE WHEN order_status = 'Cancelled' THEN grand_total ELSE 0 END) AS void_orders,
        SUM(CASE WHEN order_status = 'Completed' THEN cgst ELSE 0 END) AS total_cgst,
        SUM(CASE WHEN order_status = 'Completed' THEN sgst ELSE 0 END) AS total_sgst,
        SUM(CASE WHEN order_status = 'Completed' THEN  (amount + cgst + sgst)-grand_total  ELSE 0 END) AS total_discounts
    FROM 
        orders 
    WHERE 
        restaurant_id = ?
        AND DATE(date) = CURDATE();
`;


            const categorySalesQuery = `
SELECT 
    mcat.name AS category_name,
    SUM(od.price * od.quantity) AS total_sale 
FROM 
    order_details od
LEFT JOIN 
    menu_items mi ON od.menu_item_id = mi.id
LEFT JOIN 
    menu_category mcat ON mi.menu_category_id = mcat.id
INNER JOIN 
    orders o ON od.order_id = o.id
WHERE 
    od.restaurant_id = ? 
    AND od.isCancelled = 0
    AND DATE(date) = CURDATE()
    AND o.order_status = 'Completed'
GROUP BY 
    mcat.name
    ORDER BY 
    total_sale DESC
LIMIT 10;
`;


            const cancelledOrdersQuery = `
SELECT * 
FROM orders 
WHERE order_status = 'Cancelled' 
AND restaurant_id = ? 
AND DATE(date) = CURDATE()
ORDER BY date DESC
LIMIT 10;
`;


            const completedOrdersQuery = `
SELECT * 
FROM orders 
WHERE order_status = 'Completed' 
AND restaurant_id = ? 
AND DATE(date) = CURDATE()
ORDER BY date DESC
LIMIT 10;
`;


            const menuSalesQuery = `
SELECT 
    mi.name AS menu_name,
    SUM(od.price * od.quantity) AS total_sale 
FROM 
    order_details od
LEFT JOIN 
    menu_items mi ON od.menu_item_id = mi.id
INNER JOIN 
    orders o ON od.order_id = o.id
WHERE 
    od.restaurant_id = ? 
    AND od.isCancelled = 0
    AND DATE(o.date) = CURDATE()
    AND o.order_status = 'Completed'
GROUP BY 
    mi.name
ORDER BY 
    total_sale DESC
LIMIT 20;
`;



            const [generalBriefResults] = await db.promise().query(generalBriefQuery, [restaurantId]);
            const [categorySalesResults] = await db.promise().query(categorySalesQuery, [restaurantId]);
            const [cancelledOrdersResults] = await db.promise().query(cancelledOrdersQuery, [restaurantId]);
            const [completedOrdersResults] = await db.promise().query(completedOrdersQuery, [restaurantId]);
            const [menuSalesResults] = await db.promise().query(menuSalesQuery, [restaurantId]);

            const response = {
                generalBriefReport: generalBriefResults[0] || {},
                categorySales: categorySalesResults || [],
                cancelledOrders: cancelledOrdersResults || [],
                completedOrders: completedOrdersResults || [],
                menuSales: menuSalesResults || []
            };

            res.json(response);
        } catch (error) {
            console.error('Error fetching report:', error);
            res.status(500).json({ error: 'Failed to fetch report' });
        }
    }

    static async getGeneralViewAllReport(req, res) {
        const { restaurantId } = req.body;
        try {



            const categorySalesQuery = `
            SELECT 
                mcat.name AS category_name,
                SUM(od.price * od.quantity) AS total_sale,
                COUNT(DISTINCT mi.id) AS menu_item_count
            FROM 
                order_details od
            LEFT JOIN 
                menu_items mi ON od.menu_item_id = mi.id
            LEFT JOIN 
                menu_category mcat ON mi.menu_category_id = mcat.id
            INNER JOIN 
                orders o ON od.order_id = o.id
            WHERE 
                od.restaurant_id = ? 
                AND od.isCancelled = 0
                AND DATE(o.date) = CURDATE()
                AND o.order_status = 'Completed'
            GROUP BY 
                mcat.name
            ORDER BY 
                total_sale DESC;
            `;
            


            const cancelledOrdersQuery = `
SELECT * 
FROM orders 
WHERE order_status = 'Cancelled' 
AND restaurant_id = ? 
AND DATE(date) = CURDATE()
ORDER BY date DESC
`;


            const completedOrdersQuery = `
SELECT * 
FROM orders 
WHERE order_status = 'Completed' 
AND restaurant_id = ? 
AND DATE(date) = CURDATE()
ORDER BY date DESC
`;


            const menuSalesQuery = `
SELECT 
    mi.name AS menu_name,
    SUM(od.quantity) AS item_count,
    SUM(od.price * od.quantity) AS total_sale 
FROM 
    order_details od
LEFT JOIN 
    menu_items mi ON od.menu_item_id = mi.id
INNER JOIN 
    orders o ON od.order_id = o.id
WHERE 
    od.restaurant_id = ? 
    AND od.isCancelled = 0
    AND DATE(o.date) = CURDATE()
    AND o.order_status = 'Completed'
GROUP BY 
    mi.name
ORDER BY 
    total_sale DESC
`;




            const [categorySalesResults] = await db.promise().query(categorySalesQuery, [restaurantId]);
            const [cancelledOrdersResults] = await db.promise().query(cancelledOrdersQuery, [restaurantId]);
            const [completedOrdersResults] = await db.promise().query(completedOrdersQuery, [restaurantId]);
            const [menuSalesResults] = await db.promise().query(menuSalesQuery, [restaurantId]);

            const response = {
                categorySales: categorySalesResults || [],
                cancelledOrders: cancelledOrdersResults || [],
                completedOrders: completedOrdersResults || [],
                menuSales: menuSalesResults || []
            };

            res.json(response);
        } catch (error) {
            console.error('Error fetching report:', error);
            res.status(500).json({ error: 'Failed to fetch report' });
        }
    }

    static async getDetailedReport(req, res) {
        const { restaurantId, startDate, endDate } = req.body;
        if (!restaurantId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        try {
            //ORDER REPORT
            const orderReportQuery = `
            SELECT 
                orders.id AS order_id, 
                orders.order_id AS o_id, 
                orders.*, 
                tables.label AS table_label,
                CASE 
                    WHEN orders.waiter_id IS NOT NULL THEN users.first_name
                    ELSE NULL
                END AS cancelled_by,
                order_details.id AS order_detail_id,
                order_details.*, 
                menu_items.name AS menu_item_name, 
                menu_items.cgst AS item_cgst, 
                menu_items.sgst AS item_sgst,
                CASE
                    WHEN orders.order_status IN ('Cancelled', 'Completed') THEN 
                        (CAST(orders.amount AS DECIMAL(10, 2)) + 
                         CAST(orders.cgst AS DECIMAL(10, 2)) + 
                         CAST(orders.sgst AS DECIMAL(10, 2)) - 
                         CAST(orders.grand_total AS DECIMAL(10, 2)))
                    ELSE 0
                END AS discount
            FROM 
                orders
            LEFT JOIN 
                tables ON orders.table_no = tables.id
            LEFT JOIN 
                order_details ON orders.id = order_details.order_id
            LEFT JOIN 
                menu_items ON order_details.menu_item_id = menu_items.id
            LEFT JOIN 
                users ON orders.waiter_id = users.id 
            WHERE 
                orders.restaurant_id = ?
                AND DATE(orders.date) BETWEEN ? AND ?
                AND orders.order_status IN ('Cancelled', 'Completed')
            ORDER BY 
                orders.date DESC, orders.time DESC;
        `;
        

            const [orderReportQueryResults] = await db.promise().query(orderReportQuery, [restaurantId, startDate, endDate]);

            const ordersMap = new Map();
            orderReportQueryResults.forEach(row => {
                if (!ordersMap.has(row.order_id)) {
                    ordersMap.set(row.order_id, {
                        ...row,
                        items: []
                    });
                }

                ordersMap.get(row.order_id).items.push({
                    order_detail_id: row.order_detail_id,
                    orderId: row.o_id,
                    kot_id: row.kot_id,
                    isCancelled: row.isCancelled,
                    cancellation_reason: row.cancellation_reason,
                    cancelled_by: row.cancelled_by,
                    menu_item_name: row.menu_item_name,
                    quantity: row.quantity,
                    price: row.price,
                    item_cgst: row.item_cgst,
                    item_sgst: row.item_sgst
                });
            });


            const orderReport = Array.from(ordersMap.values());
            ////

            //ITEM REPORT
            const itemReportQuery = `
SELECT 
    mi.name AS menu_name,
    SUM(od.quantity) AS item_count,
    SUM(od.price * od.quantity) AS total_sale 
FROM 
    order_details od
LEFT JOIN 
    menu_items mi ON od.menu_item_id = mi.id
INNER JOIN 
    orders o ON od.order_id = o.id
WHERE 
    od.restaurant_id = ? 
    AND od.isCancelled = 0
    AND DATE(o.date) BETWEEN ? AND ?
    AND o.order_status = 'Completed'
GROUP BY 
    mi.name
ORDER BY 
    total_sale DESC;

`;

            const [itemReportQueryResults] = await db.promise().query(itemReportQuery, [restaurantId, startDate, endDate]);



            ////
            //DISCOUNT  REPORT

            const discountReportQuery = `
 SELECT 
     orders.*, 
     tables.label AS table_label,
     CASE
         WHEN orders.order_status IN ('Cancelled', 'Completed') THEN 
             (CAST(orders.amount AS DECIMAL(10, 2)) + 
              CAST(orders.cgst AS DECIMAL(10, 2)) + 
              CAST(orders.sgst AS DECIMAL(10, 2)) - 
              CAST(orders.grand_total AS DECIMAL(10, 2)))
         ELSE 0
     END AS discount
 FROM 
     orders
 JOIN 
     tables ON orders.table_no = tables.id
 WHERE 
     orders.restaurant_id = ?
     AND DATE(orders.date) BETWEEN ? AND ?
     AND orders.order_status IN ('Completed')
 ORDER BY 
     orders.date DESC, orders.time DESC;
 `;

            const [discountReportQueryResults] = await db.promise().query(discountReportQuery, [restaurantId, startDate, endDate]);
            const waiterReportQuery = `
            SELECT
               users.first_name AS waiter,
               MAX(orders.date) AS latest_date,                             -- Aggregating date to use in ORDER BY
               COUNT(orders.table_no) AS table_count,
               SUM(orders.grand_total) / COUNT(orders.table_no) AS per_table_income,
               SUM(orders.head_count) AS total_customers,
               SUM(orders.grand_total) / SUM(orders.head_count) AS per_customer_income,
               COUNT(orders.id) AS total_bills,
               SUM(CASE WHEN orders.order_status = 'Cancelled' THEN 1 ELSE 0 END) AS void_bills,
               SUM(orders.grand_total) / COUNT(orders.id) AS per_bill_income,
               SUM(CASE WHEN orders.payment_mode = 'Cash' THEN orders.grand_total ELSE 0 END) AS cash_income,
               SUM(CASE WHEN orders.payment_mode = 'Card' THEN orders.grand_total ELSE 0 END) AS card_income,
               SUM(CASE WHEN orders.payment_mode = 'UPI' THEN orders.grand_total ELSE 0 END) AS upi_income,
               SUM(orders.grand_total) AS total_income
           FROM
               orders
           JOIN 
               users ON orders.waiter_id = users.id
           WHERE
               orders.restaurant_id = ?
               AND DATE(orders.date) BETWEEN ? AND ?                -- Filtering by date range
               AND orders.order_status IN ('Completed', 'Cancelled')
               AND orders.waiter_id IS NOT NULL                     -- Exclude records where waiter_id is NULL
           GROUP BY
               orders.waiter_id, users.first_name                   -- Grouping by waiter_id and first_name
           ORDER BY
               latest_date DESC;                                    -- Sorting by the latest date within each group
           `;




            const [waiterReportQueryResults] = await db.promise().query(waiterReportQuery, [restaurantId, startDate, endDate]);

            const response = {
                orderReport: orderReport || [],
                itemReport: itemReportQueryResults,
                waiterReport: waiterReportQueryResults,
                discountReport: discountReportQueryResults
            };

            res.json(response);
        }
        catch (error) {
            console.error('Error fetching report:', error);
            res.status(500).json({ error: 'Failed to fetch report' });
        }
    }


}

export { ReportsController };
