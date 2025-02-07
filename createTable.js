import mysql from 'mysql2';
import express from 'express';
const app = express();

// MySQL connection setup
const db = mysql.createConnection({
  host: '166.1.227.11',
  user: 'gen_user', // Replace with your MySQL username
  password: '@Om1FCuua8AR=A', // Replace with your MySQL password
  database: 'buybyeqtestdb', // Replace with your database name
});

// const db = mysql.createConnection({
//   host: '127.0.0.1',
//   user: 'root', // Replace with your MySQL username
//   password: 'Lipika123@', // Replace with your MySQL password
//   database: 'testdb', // Replace with your database name
// });

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database.');
});

// Table creation queries
const tableQueries = [

  
  `CREATE TABLE IF NOT EXISTS business_entity (
    business_entity_id int NOT NULL AUTO_INCREMENT,
    business_name varchar(255) DEFAULT NULL,
    name varchar(255) DEFAULT NULL,
    email varchar(255) DEFAULT NULL,
    contact_no varchar(255) DEFAULT NULL,
    address text,
    group_id int DEFAULT NULL,
    business_type varchar(4) DEFAULT NULL,
    PRIMARY KEY (business_entity_id)
  )`,


  `CREATE TABLE IF NOT EXISTS restaurants (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) DEFAULT NULL,
    is_active tinyint(1) DEFAULT NULL,
    subscription_date date DEFAULT NULL,
    expiry_date date DEFAULT NULL,
    gst_no varchar(50) DEFAULT NULL,
    wera_id int DEFAULT NULL,
    products text,
    business_group varchar(255) DEFAULT NULL,
    email varchar(255) DEFAULT NULL,
    address varchar(255) DEFAULT NULL,
    phone varchar(20) DEFAULT NULL,
    lat decimal(10,6) DEFAULT NULL,
    lng decimal(10,6) DEFAULT NULL,
    type varchar(50) DEFAULT NULL,
    business_entity_id int DEFAULT NULL,
    PRIMARY KEY (id)
  )`,

  `CREATE TABLE IF NOT EXISTS roles (
    id int NOT NULL AUTO_INCREMENT,
    description varchar(255) DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT roles_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE IF NOT EXISTS super_roles (
    id int NOT NULL,
    super_role varchar(45) DEFAULT NULL,
    permisions varchar(45) DEFAULT NULL,
    PRIMARY KEY (id)
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id int NOT NULL AUTO_INCREMENT,
    role_id int DEFAULT NULL,
    first_name varchar(255) DEFAULT NULL,
    last_name varchar(255) DEFAULT NULL,
    email varchar(255) DEFAULT NULL,
    phone varchar(20) DEFAULT NULL,
    gender enum('Male','Female','Other') DEFAULT NULL,
    password varchar(255) DEFAULT NULL,
    is_active tinyint(1) DEFAULT NULL,
    user_type int DEFAULT '0',
    PRIMARY KEY (id),
    KEY role_id (role_id),
    KEY fk_super_id (user_type),
    CONSTRAINT fk_super_id FOREIGN KEY (user_type) REFERENCES super_roles (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT users_ibfk_1 FOREIGN KEY (role_id) REFERENCES roles (id)
  )`,

  `CREATE TABLE IF NOT EXISTS user_business_entity_role_mapping (
    uberm_id int NOT NULL AUTO_INCREMENT,
    user_id int DEFAULT NULL,
    business_entity_id int DEFAULT NULL,
    role text,
    PRIMARY KEY (uberm_id)
  )`,
  

  `CREATE TABLE IF NOT EXISTS menu_category (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) DEFAULT NULL,
    description text,
    is_active tinyint(1) DEFAULT NULL,
    updated_on datetime DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT menu_category_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE IF NOT EXISTS recipe_master (
    id int NOT NULL AUTO_INCREMENT,
    recipe_name varchar(100) DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT recipe_master_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

    
  `CREATE TABLE IF NOT EXISTS menu_items (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) DEFAULT NULL,
    description text,
    type varchar(50) DEFAULT NULL,
    cgst decimal(10,2) DEFAULT NULL,
    sgst decimal(10,2) DEFAULT NULL,
    price decimal(10,2) DEFAULT NULL,
    image varchar(255) DEFAULT NULL,
    is_active tinyint(1) DEFAULT NULL,
    updated_on datetime DEFAULT NULL,
    menu_category_id int DEFAULT NULL,
    section int DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    recipe_id int DEFAULT NULL,
    code text,
    PRIMARY KEY (id),
    KEY menu_category_id (menu_category_id),
    KEY restaurant_id (restaurant_id),
    KEY fk_recipe (recipe_id),
    CONSTRAINT fk_recipe FOREIGN KEY (recipe_id) REFERENCES recipe_master (id),
    CONSTRAINT menu_items_ibfk_1 FOREIGN KEY (menu_category_id) REFERENCES menu_category (id),
    CONSTRAINT menu_items_ibfk_2 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,


  `CREATE TABLE IF NOT EXISTS unit (
    id int NOT NULL AUTO_INCREMENT,
    unit_name varchar(50) NOT NULL,
    restaurant_id varchar(40) DEFAULT NULL,
    short_name text,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS unit_conversion (
    id int NOT NULL AUTO_INCREMENT,
    from_unit_id int DEFAULT NULL,
    to_unit_id int DEFAULT NULL,
    conversion_rate decimal(10,4) DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY from_unit_id (from_unit_id),
    KEY to_unit_id (to_unit_id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT unit_conversion_ibfk_1 FOREIGN KEY (from_unit_id) REFERENCES unit (id),
    CONSTRAINT unit_conversion_ibfk_2 FOREIGN KEY (to_unit_id) REFERENCES unit (id),
    CONSTRAINT unit_conversion_ibfk_3 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,


   
  `CREATE TABLE IF NOT EXISTS menu_ingredients (
    id int NOT NULL AUTO_INCREMENT,
    ingredient_name varchar(50) DEFAULT NULL,
    unit_id int DEFAULT NULL,
    calculated_position float DEFAULT NULL,
    last_updated_position float DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    deviation_limit int DEFAULT NULL,
    threshold int DEFAULT NULL,
    expiry_date date DEFAULT NULL,
    last_updated_time timestamp NULL DEFAULT NULL,
    last_purchase_date datetime DEFAULT NULL,
    PRIMARY KEY (id),
    KEY unit_id (unit_id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT menu_ingredients_ibfk_1 FOREIGN KEY (unit_id) REFERENCES unit (id),
    CONSTRAINT menu_ingredients_ibfk_2 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,
  
  
  `CREATE TABLE IF NOT EXISTS recipe_menu_ingredient (
    id int NOT NULL AUTO_INCREMENT,
    recipe_id int DEFAULT NULL,
    menu_ingredient_id int DEFAULT NULL,
    quantity decimal(10,2) DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    unit_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY recipe_id (recipe_id),
    KEY menu_ingredient_id (menu_ingredient_id),
    KEY restaurant_id (restaurant_id),
    KEY unit_id (unit_id),
    CONSTRAINT recipe_menu_ingredient_ibfk_1 FOREIGN KEY (recipe_id) REFERENCES recipe_master (id),
    CONSTRAINT recipe_menu_ingredient_ibfk_2 FOREIGN KEY (menu_ingredient_id) REFERENCES menu_ingredients (id),
    CONSTRAINT recipe_menu_ingredient_ibfk_3 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
    CONSTRAINT recipe_menu_ingredient_ibfk_4 FOREIGN KEY (unit_id) REFERENCES unit (id)
  )`,

  `CREATE TABLE IF NOT EXISTS inventory_update_logs (
    id int NOT NULL AUTO_INCREMENT,
    ingredient_id int NOT NULL,
    new_quantity float NOT NULL,
    calculated_position float NOT NULL,
    last_updated_position float NOT NULL,
    reason varchar(255) NOT NULL,
    purchase_log tinyint NOT NULL,
    update_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    restaurant_id int DEFAULT NULL,
    user_id int DEFAULT NULL,
    forced_update int DEFAULT NULL,
    purchase_amount double DEFAULT NULL,
    PRIMARY KEY (id),
    KEY ingredient_id (ingredient_id),
    CONSTRAINT inventory_update_logs_ibfk_1 FOREIGN KEY (ingredient_id) REFERENCES menu_ingredients (id)
  )`,
  `CREATE TABLE IF NOT EXISTS ingredient_transactions (
    id int NOT NULL AUTO_INCREMENT,
    menu_ingredient_id int DEFAULT NULL,
    quantity decimal(10,2) DEFAULT NULL,
    unit_id int DEFAULT NULL,
    action varchar(50) DEFAULT NULL,
    update_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY menu_ingredient_id (menu_ingredient_id),
    KEY unit_id (unit_id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT ingredient_transactions_ibfk_1 FOREIGN KEY (menu_ingredient_id) REFERENCES menu_ingredients (id),
    CONSTRAINT ingredient_transactions_ibfk_2 FOREIGN KEY (unit_id) REFERENCES unit (id),
    CONSTRAINT ingredient_transactions_ibfk_3 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE IF NOT EXISTS day_operations (
    id int NOT NULL AUTO_INCREMENT,
    restaurant_id int NOT NULL,
    open_date date NOT NULL,
    close_date date DEFAULT NULL,
    date date NOT NULL,
    open_time time DEFAULT NULL,
    close_time time DEFAULT NULL,
    is_closed tinyint(1) DEFAULT '0',
    total_drawer_cash double DEFAULT NULL,
    initial_cash_drawer double DEFAULT NULL,
    total_cash_amount double DEFAULT NULL,
    reason text,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,

  `CREATE TABLE IF NOT EXISTS customer_table (
    id int NOT NULL AUTO_INCREMENT,
    first_name varchar(50) DEFAULT NULL,
    last_name varchar(50) DEFAULT NULL,
    phone varchar(20) DEFAULT NULL,
    updated_on datetime DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT customer_table_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,


  `CREATE TABLE IF NOT EXISTS orders (
    id int NOT NULL AUTO_INCREMENT,
    order_id int DEFAULT NULL,
    date date DEFAULT NULL,
    time time DEFAULT NULL,
    type varchar(50) DEFAULT NULL,
    table_no int DEFAULT NULL,
    token_no int DEFAULT NULL,
    amount decimal(10,2) DEFAULT NULL,
    cgst decimal(10,2) DEFAULT NULL,
    sgst decimal(10,2) DEFAULT NULL,
    parcel_charges decimal(10,2) DEFAULT NULL,
    delivery_charges decimal(10,2) DEFAULT NULL,
    other_charges decimal(10,2) DEFAULT NULL,
    grand_total decimal(10,2) DEFAULT NULL,
    payment_mode varchar(50) DEFAULT NULL,
    customer_id int DEFAULT NULL,
    head_count int DEFAULT NULL,
    waiter_id int DEFAULT NULL,
    order_status varchar(50) DEFAULT NULL,
    payment_status varchar(50) DEFAULT NULL,
    updated_by int DEFAULT NULL,
    updated_on datetime DEFAULT NULL,
    cancellation_reason varchar(255) DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    via_cash double DEFAULT '0',
    via_card double DEFAULT '0',
    via_upi double DEFAULT '0',
    via_other double DEFAULT '0',
    PRIMARY KEY (id),
    KEY customer_id (customer_id),
    KEY waiter_id (waiter_id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT orders_ibfk_1 FOREIGN KEY (customer_id) REFERENCES customer_table (id),
    CONSTRAINT orders_ibfk_2 FOREIGN KEY (waiter_id) REFERENCES users (id),
    CONSTRAINT orders_ibfk_3 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE IF NOT EXISTS order_details (
    id int NOT NULL AUTO_INCREMENT,
    order_id int DEFAULT NULL,
    kot_id int DEFAULT NULL,
    menu_item_id int DEFAULT NULL,
    quantity int DEFAULT NULL,
    price decimal(10,2) DEFAULT NULL,
    instruction text,
    isCancelled int DEFAULT NULL,
    updated_on datetime DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    cancellation_reason text,
    cancelled_at datetime DEFAULT NULL,
    PRIMARY KEY (id),
    KEY order_id (order_id),
    KEY menu_item_id (menu_item_id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT order_details_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT order_details_ibfk_2 FOREIGN KEY (menu_item_id) REFERENCES menu_items (id),
    CONSTRAINT order_details_ibfk_3 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE IF NOT EXISTS payment_methods (
    id int NOT NULL AUTO_INCREMENT,
    type varchar(50) DEFAULT NULL,
    is_active tinyint(1) DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT payment_methods_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE IF NOT EXISTS plans (
    plan_id int NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    description text,
    price decimal(10,2) NOT NULL,
    billing_cycle enum('monthly','yearly') NOT NULL,
    features json DEFAULT NULL,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    product_id int DEFAULT NULL,
    PRIMARY KEY (plan_id)
  )`,
    
  `CREATE TABLE IF NOT EXISTS retail_shops (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) DEFAULT NULL,
    is_active tinyint(1) DEFAULT NULL,
    subscription_date date DEFAULT NULL,
    expiry_date date DEFAULT NULL,
    gst_no varchar(50) DEFAULT NULL,
    wera_id int DEFAULT NULL,
    products text,
    business_group varchar(255) DEFAULT NULL,
    email varchar(255) DEFAULT NULL,
    address varchar(255) DEFAULT NULL,
    phone varchar(20) DEFAULT NULL,
    lat decimal(10,6) DEFAULT NULL,
    lng decimal(10,6) DEFAULT NULL,
    type varchar(50) DEFAULT NULL,
    business_entity_id int DEFAULT NULL,
    PRIMARY KEY (id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS retail_category (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    is_active tinyint(1) DEFAULT '1',
    updated_on datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    retail_shop_id int NOT NULL,
    PRIMARY KEY (id),
    KEY fk_retail_category_shop (retail_shop_id),
    CONSTRAINT fk_retail_category_shop FOREIGN KEY (retail_shop_id) REFERENCES retail_shops (id) ON DELETE CASCADE
  )`,

  `CREATE TABLE category_sku (
  id int NOT NULL AUTO_INCREMENT,
  sku_code varchar(50) NOT NULL,
  description text,
  category_id int NOT NULL,
  retail_shop_id int NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY sku_code (sku_code),
  UNIQUE KEY unique_sku_code (category_id,sku_code),
  KEY fk_category_sku_category (category_id),
  KEY fk_category_sku_shop (retail_shop_id),
  CONSTRAINT fk_category_sku_category FOREIGN KEY (category_id) REFERENCES retail_category (id) ON DELETE CASCADE,
  CONSTRAINT fk_category_sku_shop FOREIGN KEY (retail_shop_id) REFERENCES retail_shops (id) ON DELETE CASCADE
)`,
  
  `CREATE TABLE retail_items (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  barcode varchar(255) DEFAULT NULL,
  cgst decimal(5,2) DEFAULT '0.00',
  sgst decimal(5,2) DEFAULT '0.00',
  hsn_code varchar(50) DEFAULT NULL,
  is_active tinyint(1) DEFAULT '1',
  category_id int DEFAULT NULL,
  retail_shop_id int NOT NULL,
  updated_on datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  category_sku_id int NOT NULL,
  PRIMARY KEY (id),
  KEY category_id (category_id),
  KEY retail_shop_id (retail_shop_id),
  KEY fk_items_category_sku (category_sku_id),
  CONSTRAINT fk_items_category_sku FOREIGN KEY (category_sku_id) REFERENCES category_sku (id) ON DELETE CASCADE,
  CONSTRAINT retail_items_ibfk_1 FOREIGN KEY (category_id) REFERENCES retail_category (id) ON DELETE CASCADE,
  CONSTRAINT retail_items_ibfk_2 FOREIGN KEY (retail_shop_id) REFERENCES retail_shops (id) ON DELETE CASCADE

)`, 
 
  
  `CREATE TABLE IF NOT EXISTS billing_details (
    billing_id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL,
    card_number varchar(255) DEFAULT NULL,
    expiry_date date DEFAULT NULL,
    billing_address varchar(255) DEFAULT NULL,
    city varchar(50) DEFAULT NULL,
    state varchar(50) DEFAULT NULL,
    zip_code varchar(10) DEFAULT NULL,
    country varchar(50) DEFAULT NULL,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (billing_id),
    KEY user_id (user_id),
    CONSTRAINT billing_details_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS business_entity_product_mapping (
    bepm_id int NOT NULL AUTO_INCREMENT,
    product_id int DEFAULT NULL,
    group_id int DEFAULT NULL,
    is_active int DEFAULT NULL,
    business_entity_id int DEFAULT NULL,
    PRIMARY KEY (bepm_id)
  )`,
  
`CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL,
    plan_id int NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT NULL,
    status enum('active','canceled','expired','trial') DEFAULT 'active',
    next_billing_date date DEFAULT NULL,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    trial_start_date date DEFAULT NULL,
    trial_end_date date DEFAULT NULL,
    PRIMARY KEY (subscription_id),
    KEY user_id (user_id),
    KEY plan_id (plan_id),
    CONSTRAINT subscriptions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT subscriptions_ibfk_2 FOREIGN KEY (plan_id) REFERENCES plans (plan_id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS invoices (
    invoice_id int NOT NULL AUTO_INCREMENT,
    subscription_id int NOT NULL,
    invoice_date date NOT NULL,
    due_date date NOT NULL,
    amount decimal(10,2) NOT NULL,
    status enum('paid','unpaid','overdue') NOT NULL,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (invoice_id),
    KEY subscription_id (subscription_id),
    CONSTRAINT invoices_ibfk_1 FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id)
  )`,

  `CREATE TABLE IF NOT EXISTS payments (
    payment_id int NOT NULL AUTO_INCREMENT,
    subscription_id int NOT NULL,
    amount decimal(10,2) NOT NULL,
    currency varchar(3) NOT NULL,
    payment_date date NOT NULL,
    payment_method enum('credit card','PayPal') NOT NULL,
    status enum('successful','failed','pending') NOT NULL,
    transaction_id varchar(255) DEFAULT NULL,
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    KEY subscription_id (subscription_id),
    CONSTRAINT payments_ibfk_1 FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id)
  )`,
 
  `CREATE TABLE IF NOT EXISTS products (
    product_id int NOT NULL AUTO_INCREMENT,
    product_name varchar(50) DEFAULT NULL,
    business_type varchar(4) DEFAULT NULL,
    description varchar(500) DEFAULT NULL,
    available_on varchar(100) DEFAULT NULL,
    video_url varchar(100) DEFAULT NULL,
    icon text,
    PRIMARY KEY (product_id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS purchase (
    id int NOT NULL AUTO_INCREMENT,
    menu_ingredient_id int DEFAULT NULL,
    quantity decimal(10,2) DEFAULT NULL,
    vendor_name varchar(100) DEFAULT NULL,
    price decimal(10,2) DEFAULT NULL,
    purchase_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    restaurant_id int DEFAULT NULL,
    expiry_date date DEFAULT NULL,
    PRIMARY KEY (id),
    KEY menu_ingredient_id (menu_ingredient_id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT purchase_ibfk_1 FOREIGN KEY (menu_ingredient_id) REFERENCES menu_ingredients (id),
    CONSTRAINT purchase_ibfk_2 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS restaurant_sections (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) DEFAULT NULL,
    description text,
    max_table_capacity int DEFAULT NULL,
    no_of_tables int DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT restaurant_sections_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS retail_sections (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    is_active tinyint(1) DEFAULT '1',
    retail_shop_id int NOT NULL,
    updated_on datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY retail_shop_id (retail_shop_id),
    CONSTRAINT retail_sections_ibfk_1 FOREIGN KEY (retail_shop_id) REFERENCES retail_shops (id) ON DELETE CASCADE
  )`,
  
  
  `CREATE TABLE IF NOT EXISTS retail_section_category_mapping (
    id int NOT NULL AUTO_INCREMENT,
    section_id int NOT NULL,
    category_id int NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_retail_section_category (section_id,category_id),
    KEY category_id (category_id),
    CONSTRAINT retail_section_category_mapping_ibfk_1 FOREIGN KEY (section_id) REFERENCES retail_sections (id) ON DELETE CASCADE,
    CONSTRAINT retail_section_category_mapping_ibfk_2 FOREIGN KEY (category_id) REFERENCES retail_category (id) ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS tables (
    id int NOT NULL AUTO_INCREMENT,
    label varchar(255) DEFAULT NULL,
    status enum('Occupied','Available','Reserved') DEFAULT NULL,
    capacity int DEFAULT NULL,
    is_active tinyint(1) DEFAULT NULL,
    section_id int DEFAULT NULL,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT tables_ibfk_1 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE IF NOT EXISTS wastage (
    id int NOT NULL AUTO_INCREMENT,
    menu_ingredient_id int DEFAULT NULL,
    wastage_reason varchar(255) DEFAULT NULL,
    wastage_quantity decimal(10,2) DEFAULT NULL,
    wastage_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    restaurant_id int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY menu_ingredient_id (menu_ingredient_id),
    KEY restaurant_id (restaurant_id),
    CONSTRAINT wastage_ibfk_1 FOREIGN KEY (menu_ingredient_id) REFERENCES menu_ingredients (id),
    CONSTRAINT wastage_ibfk_2 FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
  )`,

  `CREATE TABLE retail_customers (
  id int NOT NULL AUTO_INCREMENT,
  retail_shop_id int NOT NULL,
  name varchar(255) DEFAULT NULL,
  phone varchar(20) DEFAULT NULL,
  gst_number varchar(50) DEFAULT NULL,
  customer_type enum('New','Repeat') DEFAULT 'New',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) `,
 `CREATE TABLE retail_orders (
  id int NOT NULL AUTO_INCREMENT,
  date date DEFAULT NULL,
  time time DEFAULT NULL,
  retail_shop_id int NOT NULL,
  order_no varchar(50) NOT NULL,
  customer_id int DEFAULT NULL,
  user_id int DEFAULT NULL,
  total_amount decimal(10,2) NOT NULL DEFAULT '0.00',
  total_discount decimal(10,2) NOT NULL DEFAULT '0.00',
  taxable_amount decimal(10,2) NOT NULL DEFAULT '0.00',
  total_cgst decimal(10,2) NOT NULL DEFAULT '0.00',
  total_sgst decimal(10,2) NOT NULL DEFAULT '0.00',
  grand_total decimal(10,2) NOT NULL DEFAULT '0.00',
  payment_status enum('Pending','Paid','Cancelled') DEFAULT 'Pending',
  payment_mode varchar(50) DEFAULT NULL,
  via_cash double DEFAULT '0',
  via_card double DEFAULT '0',
  via_upi double DEFAULT '0',
  order_status enum('Ongoing','Completed','Cancelled','Hold') DEFAULT 'Ongoing',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  discount_type enum('Percentage','Fixed') DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY order_no (order_no),
  KEY customer_id (customer_id),
  KEY user_id (user_id),
  CONSTRAINT retail_orders_ibfk_1 FOREIGN KEY (customer_id) REFERENCES retail_customers (id) ON DELETE SET NULL,
  CONSTRAINT retail_orders_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) `,

`CREATE TABLE retail_order_items (
  id int NOT NULL AUTO_INCREMENT,
  retail_shop_id int NOT NULL,
  order_id int NOT NULL,
  item_id int NOT NULL,
  quantity int NOT NULL DEFAULT '1',
  unit_price decimal(10,2) NOT NULL,
  discount_type enum('Percentage','Fixed') DEFAULT NULL,
  discount decimal(10,2) DEFAULT '0.00',
  discounted_price decimal(10,2) NOT NULL DEFAULT '0.00',
  taxable_amount decimal(10,2) NOT NULL DEFAULT '0.00',
  cgst decimal(10,2) NOT NULL DEFAULT '0.00',
  sgst decimal(10,2) NOT NULL DEFAULT '0.00',
  total_price decimal(10,2) NOT NULL DEFAULT '0.00',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY order_id (order_id),
  KEY item_id (item_id),
  CONSTRAINT retail_order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES retail_orders (id) ON DELETE CASCADE,
  CONSTRAINT retail_order_items_ibfk_2 FOREIGN KEY (item_id) REFERENCES retail_items (id) ON DELETE CASCADE
) `,

`CREATE TABLE retail_orders_hold (
  id int NOT NULL AUTO_INCREMENT,
  retail_shop_id int NOT NULL,
  order_id int NOT NULL,
  hold_reason varchar(255) DEFAULT NULL,
  is_active tinyint(1) NOT NULL DEFAULT '1',
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY order_id (order_id),
  CONSTRAINT retail_orders_hold_ibfk_1 FOREIGN KEY (order_id) REFERENCES retail_orders (id) ON DELETE CASCADE
)`,
  

  
];

// Function to create tables
const createTables = async () => {
  for (let query of tableQueries) {
    db.query(query, (err, result) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Table created or already exists.');
      }
    });
  }
};

// Start the table creation process
createTables();

// Start Express server (optional)
app.listen(3000, () => {
  console.log('Server is running on port 3000.');
});
