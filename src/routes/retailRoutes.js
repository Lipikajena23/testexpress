import express from 'express';
import { retailController  } from '../controllers/retailController.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post('/add-retail-business', retailController.addRetailBusiness);
router.get('/get-all-retail-shops/:groupId', retailController.getAllRetailShops);


// Category Routes
router.post('/category', retailController.addCategory);
router.put('/category', retailController.editCategory);
router.delete('/category/:id', retailController.deleteCategory);
router.get('/categories/:retailShopId', retailController.getAllCategories);

// Section Routes
router.post('/section', retailController.addSection);
router.put('/section', retailController.editSection);
router.delete('/section/:id', retailController.deleteSection);
router.get('/sections/:retailShopId', retailController.getAllSections);

// Product Routes
router.post('/product', retailController.addProduct);
router.put('/product', retailController.editProduct);
router.delete('/product/:id', retailController.deleteProduct);
router.get('/products/:retailShopId', retailController.getAllProducts);

// Section-Category Mapping Routes
router.post('/section-category', retailController.mapSectionToCategory);  

//SKU routes
router.post('/sku', retailController.addSkuCode); 
router.put('/sku/:skuId',retailController.editSkuCode);
router.delete('/sku/:skuId',retailController.deleteSkuCode);
router.get('/sku/:retailShopId', retailController.getAllSku);

//fetch as items as per category 
router.get('/items/category/:categoryId',retailController.getItemsByCategory);
router.get('/allitemsbysku/:skuid', retailController.getAllitemsbysku);
router.get('/sections/:sectionId/categories',retailController.getCategoriesBySection);
router.get('/getitembybarcode/:barcode/:retail_shop_id/:section_id?', retailController.getitemsbybarcode);


router.get('/order-items/:order_id', retailController.getOrderItems);

//settle bill post api 
router.post('/orders/update-customer', retailController.updateOrderAndCustomer);
router.post('/orders/hold', retailController.holdOrder);
router.post('/saveitems-to-cart', retailController.addToCart);
router.get('/getallholdsorder/:retail_shop_id', retailController.getholdsorder);
router.put('/update-isactive/:id', retailController.updateIsActive);

router.put('/update-discount', retailController.updateOrderItemDiscount);
router.put('/update-quantity', retailController.updateOrderItemQuantity);
router.delete('/delete-Order-Item', retailController.deleteOrderItem);
router.post('/add-Order-item', retailController.addOrderItem);


// Update category-section mapping (enable/disable mappings)
router.put("/update-category-mapping", retailController.updateCategoryMapping);
router.get("/get-category-sections/:categoryId", retailController.getCategorySections);
router.get("/configuration/:retailShopId", retailController.getConfiguration);

router.post("/configuration", retailController.saveConfiguration);

router.get("/getAllitems/:id/:section_id?", retailController.getAllitems);

//report
router.get("/getTodayTotalAmount/:retail_shop_id", retailController.getTodayTotalAmount);
router.get("/getTodayCategoryTotals/:retail_shop_id", retailController.getTodayCategoryTotals);
router.get("/getTodayTopItems/:retail_shop_id", retailController.getTodayTopItems);
router.get("/getSoldItemsByDate/:retail_shop_id", retailController.getSoldItemsByDate);
router.get("/getOrdersWithDiscounts/:retail_shop_id", retailController. getOrdersWithDiscounts);
router.get("/getRetailOrderscustomer/:retail_shop_id", retailController. getRetailOrderscustomer);
router.get("/getRetailgstreport/:retail_shop_id", retailController. getRetailgstreport);
router.get('/getsectionreport/:retailshopid/:sectionid?', retailController.getsectionreport);
router.get('/checkCustomerType', retailController.checkCustomerType);
router.get('/getRetailBusinesses', retailController.getRetailBusinesses);
router.post("/upload-retail-data", upload.single("file"), retailController.uploadRetailData);

export default router;
