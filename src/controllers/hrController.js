import db from '../config/db.js';
import util from 'util';


class hrController{
    static async createhrUser(req, res) {
        const { first_name, email, phone, password, business_entity_id } = req.body;
        
        if (!first_name || !email || !phone || !password || !business_entity_id) {
          return res.status(400).json({ error: 'All fields are required' });
        }
    
        const query = util.promisify(db.query).bind(db);
    
        try {
          // Step 1: Insert user into `users` table
          const insertUserQuery = `
            INSERT INTO users (first_name, email, phone, password, is_active, user_type) 
            VALUES (?, ?, ?, ?, 1, 0)
          `;
          const userResult = await query(insertUserQuery, [first_name, email, phone, password]);
    
          // Get the newly created user ID
          const user_id = userResult.insertId;
    
          // Step 2: Insert into `user_business_entity_role_mapping` table
          const insertMappingQuery = `
            INSERT INTO user_business_entity_role_mapping (user_id, business_entity_id, role) 
            VALUES (?, ?, ?)
          `;
          await query(insertMappingQuery, [user_id, business_entity_id, 6]);
    
          res.status(201).json({ message: 'User created successfully', user_id });
    
        } catch (error) {
          console.error('Error creating user:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }


      static async getUsersByBusinessEntity(req, res) {
        const { business_entity_id } = req.params;
    
        if (!business_entity_id) {
            return res.status(400).json({ error: 'Business entity id is required' });
        }
    
        const query = util.promisify(db.query).bind(db);
        try {
            const sql = `
                SELECT u.*
                FROM users u
                INNER JOIN user_business_entity_role_mapping m ON u.id = m.user_id
                WHERE m.business_entity_id = ? AND m.role IN (?, ?)
            `;
    
            const users = await query(sql, [business_entity_id, 2, 6]);
            res.json(users);
    
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    


      static async createMapping(req, res) {
        const { user_id, business_entity_id, role } = req.body;
    
        // Validate request payload
        if (!user_id || !business_entity_id || !role) {
          return res.status(400).json({ error: 'user_id, business_entity_id, and role are required.' });
        }
    
        const query = util.promisify(db.query).bind(db);
    
        try {
          // Check if the mapping already exists
          const checkQuery = `
            SELECT * FROM user_business_entity_role_mapping
            WHERE user_id = ? AND business_entity_id = ? AND role = ?
          `;
          const existingMapping = await query(checkQuery, [user_id, business_entity_id, role]);
    
          if (existingMapping.length > 0) {
            return res.status(200).json({ message: 'Mapping already exists.' });
          }
    
          // Insert the new mapping since it doesn't exist
          const insertQuery = `
            INSERT INTO user_business_entity_role_mapping (user_id, business_entity_id, role)
            VALUES (?, ?, ?)
          `;
          await query(insertQuery, [user_id, business_entity_id, role]);
    
          res.status(201).json({ message: 'Mapping created successfully.' });
        } catch (error) {
          console.error('Error in createMapping:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }


      // static async upsertHrConfiguration(req, res) {
      //   const { business_entity_id, paid_days_off, required_documents } = req.body;
    
      //   // Validate required field
      //   if (!business_entity_id) {
      //     return res.status(400).json({ error: 'business_entity_id is required.' });
      //   }
    
      //   const query = util.promisify(db.query).bind(db);
    
      //   try {
      //     // Check if the business_entity_id already exists
      //     const checkQuery = `SELECT * FROM hr_configurations WHERE business_entity_id = ?`;
      //     const existingRecord = await query(checkQuery, [business_entity_id]);
    
      //     if (existingRecord.length > 0) {
      //       // Prepare dynamic update query
      //       let updateFields = [];
      //       let values = [];
    
      //       if (paid_days_off !== undefined) {
      //         updateFields.push("paid_days_off = ?");
      //         values.push(paid_days_off);
      //       }
      //       if (required_documents !== undefined) {
      //         updateFields.push("required_documents = ?");
      //         values.push(required_documents);
      //       }
    
      //       if (updateFields.length > 0) {
      //         values.push(business_entity_id);
      //         const updateQuery = `UPDATE hr_configurations SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE business_entity_id = ?`;
      //         await query(updateQuery, values);
    
      //         return res.status(200).json({ message: 'HR Configuration updated successfully.' });
      //       } else {
      //         return res.status(200).json({ message: 'No changes were made, as no valid fields were provided.' });
      //       }
      //     } else {
      //       // Insert new record
      //       const insertQuery = `
      //         INSERT INTO hr_configurations (business_entity_id, paid_days_off, required_documents)
      //         VALUES (?, ?, ?)
      //       `;
      //       await query(insertQuery, [
      //         business_entity_id,
      //         paid_days_off || 0, // Default to 0 if not provided
      //         required_documents || '[]' // Default to empty JSON array if not provided
      //       ]);
    
      //       return res.status(201).json({ message: 'HR Configuration inserted successfully.' });
      //     }
      //   } catch (error) {
      //     console.error('Error in upsertHrConfiguration:', error);
      //     res.status(500).json({ error: 'Internal Server Error' });
      //   }
      // }
      static async upsertHrConfiguration(req, res) {
        const { 
            business_entity_id, 
            required_documents, 
            attendance_edit, 
            salary_edit, 
            paid_days_off_edit 
        } = req.body;
    
        // Validate required field
        if (!business_entity_id) {
            return res.status(400).json({ error: 'business_entity_id is required.' });
        }
    
        const query = util.promisify(db.query).bind(db);
    
        try {
            // Check if the business_entity_id already exists
            const checkQuery = `SELECT * FROM hr_configurations WHERE business_entity_id = ?`;
            const existingRecord = await query(checkQuery, [business_entity_id]);
    
            if (existingRecord.length > 0) {
                // Prepare dynamic update query
                let updateFields = [];
                let values = [];
    
               
                if (required_documents !== undefined) {
                    updateFields.push("required_documents = ?");
                    values.push(required_documents);
                }
                if (attendance_edit !== undefined) {
                    updateFields.push("attendance_edit = ?");
                    values.push(attendance_edit);
                }
                if (salary_edit !== undefined) {
                    updateFields.push("wage_edit = ?");
                    values.push(salary_edit);
                }
                if (paid_days_off_edit !== undefined) {
                    updateFields.push("paid_days_off_edit = ?");
                    values.push(paid_days_off_edit);
                }
    
                if (updateFields.length > 0) {
                    values.push(business_entity_id);
                    const updateQuery = `UPDATE hr_configurations SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE business_entity_id = ?`;
                    await query(updateQuery, values);
    
                    return res.status(200).json({ message: 'HR Configuration updated successfully.' });
                } else {
                    return res.status(200).json({ message: 'No changes were made, as no valid fields were provided.' });
                }
            } else {
                // Insert new record
                const insertQuery = `
                    INSERT INTO hr_configurations (
                        business_entity_id, 
                       
                        required_documents, 
                        attendance_edit, 
                        wage_edit, 
                        paid_days_off_edit
                    ) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                await query(insertQuery, [
                    business_entity_id,
                    required_documents || '[]', // Default to empty JSON array if not provided
                    attendance_edit || false, // Default to false if not provided
                    salary_edit || false,
                    paid_days_off_edit || false
                ]);
    
                return res.status(201).json({ message: 'HR Configuration inserted successfully.' });
            }
        } catch (error) {
            console.error('Error in upsertHrConfiguration:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    


      static async getHrConfiguration(req, res) {
        const { business_entity_id } = req.params;
    
        if (!business_entity_id) {
          return res.status(400).json({ error: 'business_entity_id is required.' });
        }
    
        const query = util.promisify(db.query).bind(db);
    
        try {
          const getQuery = `SELECT * FROM hr_configurations WHERE business_entity_id = ?`;
          const results = await query(getQuery, [business_entity_id]);
    
          if (results.length > 0) {
            res.status(200).json(results[0]);
          } else {
            res.status(404).json({ message: 'No HR Configuration found for this business_entity_id.' });
          }
        } catch (error) {
          console.error('Error in getHrConfiguration:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }


      static async createEmployee(req, res) {
        const { full_name, email, phone_number, age, role, business_entity_id, is_active,entity_id, payment , date} = req.body;
        
        if (!business_entity_id || !payment) {
          return res.status(400).json({ error: 'Business Entity ID and Payment details are required' });
        }
        
       

        const query = util.promisify(db.query).bind(db);
        
        try {
          // Step 1: Insert payment details into `hr_paymentdetails` table
          const insertPaymentQuery = `
            INSERT INTO hr_paymentdetails (is_daily, is_monthly,paid_days_off, payment) 
            VALUES (?, ?,?, ?)
          `;
          const paymentResult = await query(insertPaymentQuery, [
            payment.is_daily || 0, 
            payment.is_monthly || 0, 
            payment. paid_days_off || 0,
            payment.payment
          ]);
    
          // Get the newly created payment ID
          const payment_id = paymentResult.insertId;
          
          // Step 2: Insert employee details into `employees` table
          const insertEmployeeQuery = `
            INSERT INTO employees (full_name, email, phone_number, age, role, business_entity_id, payment_id, is_active,entity_id,date ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)
          `;
    
          // If `entity_id` is provided, use it; otherwise, let MySQL auto-increment
          const employeeEntityId = business_entity_id || null;
    
          const employeeResult = await query(insertEmployeeQuery, [
            full_name, 
            email || null, 
            phone_number || null, 
            age || null, 
            role || null, 
            employeeEntityId, 
            payment_id, 
            is_active || 1,
            entity_id || null,
            date
          ]);
    
          // Get the newly created employee global_id
          const global_id = employeeResult.insertId;
    
          res.status(201).json({ message: 'Employee created successfully', global_id });
        
        } catch (error) {
          console.error('Error creating employee:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }

      

      static async getAllEmployeesByBusinessEntityId(req, res) {
        const { business_entity_id } = req.params; // Get business_entity_id from URL parameter

        if (!business_entity_id) {
            return res.status(400).json({ error: "Business Entity ID is required" });
        }

        const query = util.promisify(db.query).bind(db);

        try {
            // Step 1: Fetch employees where is_active = 1
            const employeesQuery = `
                SELECT * FROM employees 
                WHERE business_entity_id = ? AND is_active = 1
            `;
            const employees = await query(employeesQuery, [business_entity_id]);

            // Step 2: Fetch payment details for each employee
            const employeesWithPayment = await Promise.all(employees.map(async (employee) => {
                if (employee.payment_id) {
                    const paymentQuery = `
                        SELECT id ,is_daily, is_monthly, payment ,paid_days_off 
                        FROM hr_paymentdetails 
                        WHERE id = ?
                    `;
                    const paymentDetails = await query(paymentQuery, [employee.payment_id]);

                    return {
                        id:employee.global_id,
                        full_name: employee.full_name,
                        email: employee.email,
                        phone_number: employee.phone_number,
                        age: employee.age,
                        role: employee.role,
                        business_entity_id: employee.business_entity_id,
                        date:employee.date,
                        payment_id:employee.payment_id,
                        payment: paymentDetails.length > 0 ? paymentDetails[0] : null
                    };
                } else {
                    return {
                        full_name: employee.full_name,
                        email: employee.email,
                        phone_number: employee.phone_number,
                        age: employee.age,
                        role: employee.role,
                        business_entity_id: employee.business_entity_id,
                        payment: null
                    };
                }
            }));

            res.status(200).json(employeesWithPayment);

        } catch (error) {
            console.error("Error fetching employees:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
      

    

    

    static async updateEmployee(req, res) {

      const query = util.promisify(db.query).bind(db);
      try {
          const { id } = req.params;  // Get ID from URL params
          const { is_daily, is_monthly, payment, paid_days_off } = req.body; // Get updated values
  
          if (!id) {
              return res.status(400).json({ error: "Payment details ID is required." });
          }
  
          // Check if the record exists
          const checkQuery = "SELECT * FROM hr_paymentdetails WHERE id = ?";
          const existingRecord = await query(checkQuery, [id]);
  
          if (existingRecord.length === 0) {
              return res.status(404).json({ error: "Payment details not found." });
          }
  
          // Update Query
          const updateQuery = `
              UPDATE hr_paymentdetails 
              SET is_daily = ?, is_monthly = ?, payment = ?, paid_days_off = ?
              WHERE id = ?
          `;
  
          await query(updateQuery, [is_daily, is_monthly, payment, paid_days_off, id]);
  
          res.status(200).json({ message: "Payment details updated successfully." });
  
      } catch (error) {
          console.error("Error updating hr_paymentdetails:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  };


    static async deactivateUser(req, res) {
        const { global_id } = req.params;  // Get global_id from the request params
    
        if (!global_id) {
          return res.status(400).json({ error: 'Global ID is required' });
        }
    
        const query = util.promisify(db.query).bind(db);
    
        try {
          // Step 1: Update is_active to 0 for the given global_id
          const updateQuery = `
            UPDATE employees 
            SET is_active = 0 
            WHERE global_id = ?
          `;
          const result = await query(updateQuery, [global_id]);
    
          // Check if any rows were affected (if not, it means no user with that ID was found)
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
          }
    
          res.status(200).json({ message: 'Employee deactivated successfully' });
    
        } catch (error) {
          console.error('Error deactivating user:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }


      static async markAttendance(req, res) {
        const { employee_id, business_entity_id, date, status } = req.body;

        // Validate required fields
        if (!employee_id || !business_entity_id || !date || !status) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const query = util.promisify(db.query).bind(db);

        try {
            // Check if attendance already exists for this employee on this date and business entity
            const checkQuery = `
                SELECT id FROM attendance_employee 
                WHERE employee_id = ? AND business_entity_id = ? AND date = ?
            `;
            const existingRecord = await query(checkQuery, [employee_id, business_entity_id, date]);

            if (existingRecord.length > 0) {
                // Update the existing record
                const updateQuery = `
                    UPDATE attendance_employee 
                    SET status = ? 
                    WHERE employee_id = ? AND business_entity_id = ? AND date = ?
                `;
                await query(updateQuery, [status, employee_id, business_entity_id, date]);

                return res.status(200).json({ message: 'Attendance updated successfully' });
            } else {
                // Insert a new record
                const insertQuery = `
                    INSERT INTO attendance_employee (employee_id, business_entity_id, date, status) 
                    VALUES (?, ?, ?, ?)
                `;
                await query(insertQuery, [employee_id, business_entity_id, date, status]);

                return res.status(201).json({ message: 'Attendance recorded successfully' });
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getAttendance(req, res) {
      const { business_entity_id } = req.params; // Get business_entity_id from URL
      const { date } = req.query; // Date remains optional as a query parameter
      
      console.log("Received Request:", req.params, req.query); // Log received params
  
      if (!business_entity_id) {
          console.log("Error: Missing business_entity_id");
          return res.status(400).json({ error: "Business Entity ID is required" });
      }
  
      const query = util.promisify(db.query).bind(db);
  
      try {
          let getQuery = `SELECT * FROM attendance_employee WHERE business_entity_id = ?`;
          let queryParams = [business_entity_id];
  
          if (date) {
              getQuery += ` AND date = ?`;
              queryParams.push(date);
          }
  
          console.log("Executing Query:", getQuery, queryParams); // Log the final query
          const attendanceRecords = await query(getQuery, queryParams);
  
          if (attendanceRecords.length === 0) {
              console.log("No records found for business_entity_id:", business_entity_id);
              return res.status(404).json({ message: "No attendance records found for this business_entity_id and date." });
          }
  
          return res.status(200).json({ attendance: attendanceRecords });
      } catch (error) {
          console.error("Database Error:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  }
  
  static async createAdvancePayment(req, res) {
    const { employee_id, business_entity_id, amount, date, purpose, status } = req.body;

    // Validate required fields
    if (!employee_id || !business_entity_id || !amount || !date ) {
        return res.status(400).json({ error: 'All fields are required except status' });
    }

    // Default status to 'Pending' if not provided
    const paymentStatus = status || 'Pending';

    // Convert db.query to promise-based
    const query = util.promisify(db.query).bind(db);

    try {
        const insertQuery = `
            INSERT INTO advance_payment (employee_id, business_entity_id, amount, date, purpose, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        // Execute the query
        const result = await query(insertQuery, [
            employee_id,
            business_entity_id,
            amount,
            date,
            purpose,
            paymentStatus
        ]);

        res.status(201).json({ message: 'Advance Payment Created Successfully', payment_id: result.insertId });

    } catch (error) {
        console.error('Error creating advance payment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

static async getAdvancePayments(req, res) {
  // Convert db.query to promise-based
  const query = util.promisify(db.query).bind(db);

  // Extract business_entity_id from URL params and date from query
  const { business_entity_id } = req.params; // Required
  const { date } = req.query; // Optional

  try {
      // Base SQL Query
      let fetchQuery = `
          SELECT 
              e.full_name, 
              e.global_id, 
              a.purpose, 
              a.amount, 
              a.date, 
              a.status 
          FROM advance_payment a
          JOIN employees e ON a.employee_id = e.global_id
          WHERE a.business_entity_id = ? 
      `;

      // Parameters array for SQL query
      const queryParams = [business_entity_id];

      // If date filter is provided, add it to the query
      if (date) {
          fetchQuery += " AND a.date = ?";  
          queryParams.push(date);
      }

      // Execute Query
      const result = await query(fetchQuery, queryParams);

      res.status(200).json(result);

  } catch (error) {
      console.error('Error fetching advance payments:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}

  





static async getDueAmount(req, res) {
  const { employee_id, business_entity_id } = req.params;

  if (!employee_id || !business_entity_id) {
    return res.status(400).json({ error: 'Employee ID and Business Entity ID are required' });
  }

  const query = util.promisify(db.query).bind(db);

  try {
    // Fetch employee payment details
    const paymentDetailsQuery = `
      SELECT is_daily, is_monthly, payment, paid_days_off
      FROM hr_paymentdetails
      WHERE id = ?
    `;
    const [paymentDetails] = await query(paymentDetailsQuery, [employee_id]);

    if (!paymentDetails) {
      return res.status(404).json({ error: 'Payment details not found' });
    }

    const { is_daily, is_monthly, payment, paid_days_off } = paymentDetails;
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const actualDaysCurrentMonth = lastDayOfCurrentMonth.getDate();

    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const actualDaysNextMonth = lastDayOfNextMonth.getDate();

    // Fetch advance payments
    const advancePaymentQuery = `
      SELECT COALESCE(SUM(amount), 0) AS total_advance
      FROM advance_payment
      WHERE employee_id = ? AND business_entity_id = ?
    `;
    const [advancePayment] = await query(advancePaymentQuery, [employee_id, business_entity_id]);

    // Fetch last partial payment
    const lastPaymentQuery = `
      SELECT final_payment, base_amount, adding_payment, status, date AS last_payment_date
      FROM payment_transaction
      WHERE employee_id = ? AND business_entity_id = ?
      ORDER BY date DESC LIMIT 1
    `;
    const [lastPayment] = await query(lastPaymentQuery, [employee_id, business_entity_id]);

    const lastPaymentDate = lastPayment?.last_payment_date ? new Date(lastPayment.last_payment_date) : null;
    const isNextMonthPayment = lastPaymentDate &&
      lastPaymentDate.getMonth() === today.getMonth() &&
      lastPaymentDate.getFullYear() === today.getFullYear();

    const attendanceRangeStart = isNextMonthPayment ? firstDayOfNextMonth : firstDayOfCurrentMonth;
    const attendanceRangeEnd = isNextMonthPayment ? lastDayOfNextMonth : lastDayOfCurrentMonth;
    const actualMonthDays = isNextMonthPayment ? actualDaysNextMonth : actualDaysCurrentMonth;

    // Fetch employee attendance
    const attendanceQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'Present' THEN 1 ELSE NULL END) AS total_present_days,
        COUNT(CASE WHEN status = 'Absent' THEN 1 ELSE NULL END) AS total_absent_days
      FROM attendance_employee
      WHERE employee_id = ? AND business_entity_id = ? 
        AND date BETWEEN ? AND ?
    `;
    const [attendance] = await query(attendanceQuery, [
      employee_id,
      business_entity_id,
      attendanceRangeStart.toISOString().split("T")[0],
      attendanceRangeEnd.toISOString().split("T")[0]
    ]);

    let dueAmount = 0;
    let dueDate = null;

    if (is_monthly) {
      const perDaySalary = payment / actualMonthDays;
      let extraAbsences = Math.max(attendance.total_absent_days - paid_days_off, 0);
      let absentDeduction = extraAbsences * perDaySalary;
      let updatedDueAmount = payment - absentDeduction;

      updatedDueAmount -= advancePayment.total_advance;

      // if (isNextMonthPayment && attendance.total_absent_days === 0) {
      //   updatedDueAmount = payment;
      // }

      // **NEW LOGIC**: Add last month's "adding_payment" if last payment was partial
      if (lastPayment?.status === 'Partial Payment' && lastPayment?.adding_payment) {
        updatedDueAmount = parseFloat(updatedDueAmount) + parseFloat(lastPayment.adding_payment);
      }

      dueAmount = updatedDueAmount;
      dueDate = isNextMonthPayment
        ? lastDayOfNextMonth.toISOString().split("T")[0]
        : lastDayOfCurrentMonth.toISOString().split("T")[0];

    } else if (is_daily) {
      dueAmount = attendance.total_present_days * payment;
      dueAmount -= advancePayment.total_advance;

      if (lastPayment?.status === 'Partial Payment') {
        dueAmount += lastPayment.base_amount - lastPayment.final_payment;
      }

      dueDate = today.toISOString().split("T")[0];

      if (lastPayment?.status === 'Full Payment' && lastPayment?.last_payment_date === dueDate) {
        dueAmount = 0;
      }
    }

    res.status(200).json({
      employee_id,
      dueAmount,
      total_present_days: attendance.total_present_days,
      dueDate
    });

  } catch (error) {
    console.error('Error fetching due amount:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


//post payment
static async createPaymentTransaction(req, res) {
  const {
    employee_id,
    business_entity_id,
    date,
    base_amount,
    advance_payment = 0,
    adding_payment = 0,
    bonus = 0,
    status,
    final_payment
  } = req.body;

  if (
    !employee_id || 
    !business_entity_id || 
    !date || 
    !base_amount || 
    !status || 
    !final_payment
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const query = util.promisify(db.query).bind(db);

  try {
    // **1️⃣ Start Transaction**
    await query("START TRANSACTION");

    // **2️⃣ Insert into `payment_transaction`**
    const insertQuery = `
      INSERT INTO payment_transaction 
      (employee_id, business_entity_id, date, base_amount, advance_payment, adding_payment, bonus, status, final_payment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(insertQuery, [
      employee_id, 
      business_entity_id, 
      date, 
      base_amount, 
      advance_payment, 
      adding_payment, 
      bonus, 
      status, 
      final_payment
    ]);

    // **3️⃣ Fetch Pending Advance Payments**
    const fetchAdvanceQuery = `
      SELECT id FROM advance_payment 
      WHERE employee_id = ? AND business_entity_id = ? AND status = 'Pending'
    `;
    const pendingAdvances = await query(fetchAdvanceQuery, [employee_id, business_entity_id]);

    if (pendingAdvances.length > 0) {
      // **4️⃣ Update Status to 'Recovered'**
      const updateAdvanceQuery = `
        UPDATE advance_payment 
        SET status = 'Recovered' 
        WHERE employee_id = ? AND business_entity_id = ? AND status = 'Pending'
      `;
      await query(updateAdvanceQuery, [employee_id, business_entity_id]);
    }

    // **5️⃣ Commit Transaction**
    await query("COMMIT");

    res.status(201).json({ 
      message: "Payment transaction created successfully. Pending advances marked as recovered.", 
      transaction_id: result.insertId 
    });

  } catch (error) {
    console.error("Error inserting payment transaction:", error);

    // **6️⃣ Rollback Transaction on Error**
    await query("ROLLBACK");

    res.status(500).json({ error: "Internal Server Error" });
  }
}



static async getEmployeesDueAmount(req, res) {
  const { business_entity_id } = req.params;
  const { is_daily, is_monthly } = req.query;

  if (!business_entity_id) {
    return res.status(400).json({ error: 'Business Entity ID is required' });
  }

  const query = util.promisify(db.query).bind(db);

  try {
    let filterQuery = '';
    const filterValues = [business_entity_id];

    if (is_daily === 'true') {
      filterQuery += ' AND p.is_daily = 1';
    }
    if (is_monthly === 'true') {
      filterQuery += ' AND p.is_monthly = 1';
    }

    const employeesQuery = `
      SELECT e.global_id AS employee_id, e.full_name, e.role, e.payment_id, 
             p.is_daily, p.is_monthly, p.payment, e.paiddays_off
      FROM employees e
      LEFT JOIN hr_paymentdetails p ON e.payment_id = p.id
      WHERE e.business_entity_id = ? AND e.is_active = 1 ${filterQuery}
    `;
    const employees = await query(employeesQuery, filterValues);

    if (employees.length === 0) {
      return res.status(404).json({ error: 'No employees found' });
    }

    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const actualDaysCurrentMonth = lastDayOfCurrentMonth.getDate();

    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const actualDaysNextMonth = lastDayOfNextMonth.getDate();

    const results = await Promise.all(
      employees.map(async (employee) => {
        const { employee_id, full_name, role, is_daily, is_monthly, payment, paiddays_off } = employee;

        const advancePaymentQuery = `
          SELECT COALESCE(SUM(amount), 0) AS total_advance
          FROM advance_payment
          WHERE employee_id = ? AND business_entity_id = ?
        `;
        const [advancePayment] = await query(advancePaymentQuery, [employee_id, business_entity_id]);

        const lastPaymentQuery = `
          SELECT final_payment, base_amount, adding_payment, status, date AS last_payment_date
          FROM payment_transaction
          WHERE employee_id = ? AND business_entity_id = ?
          ORDER BY date DESC LIMIT 1
        `;
        const [lastPayment] = await query(lastPaymentQuery, [employee_id, business_entity_id]);

        const lastPaymentDate = lastPayment?.last_payment_date ? new Date(lastPayment.last_payment_date) : null;
        const isNextMonthPayment = lastPaymentDate &&
          lastPaymentDate.getMonth() === today.getMonth() &&
          lastPaymentDate.getFullYear() === today.getFullYear();

        const attendanceRangeStart = isNextMonthPayment ? firstDayOfNextMonth : firstDayOfCurrentMonth;
        const attendanceRangeEnd = isNextMonthPayment ? lastDayOfNextMonth : lastDayOfCurrentMonth;
        const actualMonthDays = isNextMonthPayment ? actualDaysNextMonth : actualDaysCurrentMonth;

        const attendanceQuery = `
          SELECT 
            COUNT(CASE WHEN status = 'Present' THEN 1 ELSE NULL END) AS total_present_days,
            COUNT(CASE WHEN status = 'Absent' THEN 1 ELSE NULL END) AS total_absent_days
          FROM attendance_employee
          WHERE employee_id = ? AND business_entity_id = ?
            AND date BETWEEN ? AND ?
        `;
        const [attendance] = await query(attendanceQuery, [
          employee_id,
          business_entity_id,
          attendanceRangeStart.toISOString().split("T")[0],
          attendanceRangeEnd.toISOString().split("T")[0],
        ]);

        let dueAmount = 0;
        let dueDate = null;

        if (is_monthly) {

          console.log(`Advance Payment for ${employee_id}:`, advancePayment.total_advance);

          const perDaySalary = payment / actualMonthDays;
          let extraAbsences = Math.max(attendance.total_absent_days - paiddays_off, 0);
          let absentDeduction = extraAbsences * perDaySalary;
          let updatedDueAmount = payment - absentDeduction;

          console.log("Before Advance Deduction:", updatedDueAmount);
console.log("Advance Amount:", advancePayment.total_advance);


          updatedDueAmount -= advancePayment.total_advance;
          console.log("After Advance Deduction:", updatedDueAmount);

          // if (isNextMonthPayment && attendance.total_absent_days === 0) {
          //   updatedDueAmount = payment;
          // }

          // **NEW LOGIC**: Add last month's "adding_payment" if last payment was partial
          if (lastPayment?.status === 'Partial Payment' && lastPayment?.adding_payment) {
            updatedDueAmount = parseFloat(updatedDueAmount) + parseFloat(lastPayment.adding_payment);
          }

          dueAmount = updatedDueAmount;
          dueDate = isNextMonthPayment
            ? lastDayOfNextMonth.toISOString().split("T")[0]
            : lastDayOfCurrentMonth.toISOString().split("T")[0];

        } else if (is_daily) {
          dueAmount = attendance.total_present_days * payment;
          dueAmount -= advancePayment.total_advance;

          if (lastPayment?.status === 'Partial Payment') {
            dueAmount += lastPayment.base_amount - lastPayment.final_payment;
          }

          dueDate = today.toISOString().split("T")[0];

          if (lastPayment?.status === 'Full Payment' && lastPayment?.last_payment_date === dueDate) {
            dueAmount = 0;
          }
        }

        return {
          employee_id,
          full_name,
          role,
          advance_amount: advancePayment.total_advance,
          last_payment: lastPayment?.final_payment || 0,
          base_amount: payment || 0,
          due_amount: dueAmount,
          due_date: dueDate,
          working_days: attendance.total_present_days,
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching employees due amount:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


static async getPaymentTransactions (req, res){
  const query = util.promisify(db.query).bind(db);
  try {
      const {business_entity_id} = req.params;
      const {  start_date, end_date, payment_type } = req.query;

      if (!business_entity_id || !start_date || !end_date) {
          return res.status(400).json({ error: "business_entity_id, start_date, and end_date are required." });
      }

      let sql = `
          SELECT 
              pt.id, pt.date, pt.base_amount, pt.advance_payment, pt.adding_payment, 
              pt.bonus, pt.status, pt.final_payment, pt.total_working_days,
              e.full_name, e.role
          FROM payment_transaction pt
          JOIN employees e ON pt.employee_id = e.global_id
          LEFT JOIN hr_paymentdetails hp ON e.payment_id = hp.id
          WHERE pt.business_entity_id = ?
          AND pt.date BETWEEN ? AND ?
      `;

      const params = [business_entity_id, start_date, end_date];

      // Optional filter: Daily or Monthly employees
      if (payment_type === "daily") {
          sql += " AND hp.is_daily = 1";
      } else if (payment_type === "monthly") {
          sql += " AND hp.is_monthly = 1";
      }

      const result = await query(sql, params);
      res.status(200).json(result);

  } catch (error) {
      console.error("Error fetching payment transactions:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};


// static async markEmployeeAttendance(req, res) {
//   const attendanceData = req.body;  // Expecting an array of attendance objects

//   if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
//       return res.status(400).json({ error: 'Invalid or empty attendance data' });
//   }

//   const query = util.promisify(db.query).bind(db);

//   try {
//       const insertAttendanceQuery = `
//           INSERT INTO attendance_employee (employee_id, business_entity_id, date, status) 
//           VALUES (?, ?, ?, ?)
//       `;

//       // Insert each attendance record using Promise.all
//       await Promise.all(attendanceData.map(async (record) => {
//           await query(insertAttendanceQuery, [
//               record.employee_id,
//               record.business_entity_id,
//               record.date,
//               record.status.charAt(0).toUpperCase() + record.status.slice(1)  // Capitalizing status
//           ]);
//       }));

//       res.status(201).json({ message: 'Attendance records inserted successfully' });

//   } catch (error) {
//       console.error('Error inserting attendance:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//   }
// }


static async markEmployeeAttendance(req, res) {
  const attendanceData = req.body;  // Expecting an array of attendance objects

  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty attendance data' });
  }

  const query = util.promisify(db.query).bind(db);

  try {
      // Process each attendance record using Promise.all
      await Promise.all(attendanceData.map(async (record) => {
          // Format the status (capitalize first letter)
          const formattedStatus = record.status.charAt(0).toUpperCase() + record.status.slice(1);
          
          // Check if a record exists for this employee_id and date
          const checkExistingQuery = `
              SELECT id FROM attendance_employee 
              WHERE employee_id = ? AND date = ?
          `;
          const existingRecords = await query(checkExistingQuery, [
              record.employee_id,
              record.date
          ]);
          
          if (existingRecords.length > 0) {
              // Update existing record
              const updateQuery = `
                  UPDATE attendance_employee 
                  SET status = ?, business_entity_id = ?
                  WHERE employee_id = ? AND date = ?
              `;
              await query(updateQuery, [
                  formattedStatus,
                  record.business_entity_id,
                  record.employee_id,
                  record.date
              ]);
          } else {
              // Insert new record
              const insertQuery = `
                  INSERT INTO attendance_employee (employee_id, business_entity_id, date, status) 
                  VALUES (?, ?, ?, ?)
              `;
              await query(insertQuery, [
                  record.employee_id,
                  record.business_entity_id,
                  record.date,
                  formattedStatus
              ]);
          }
      }));

      res.status(200).json({ message: 'Attendance records processed successfully' });

  } catch (error) {
      console.error('Error processing attendance:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}

static async getTodayAttendanceSummary(req, res) {
  const { business_entity_id } = req.params; // Get business_entity_id from request parameters

  if (!business_entity_id) {
      return res.status(400).json({ error: "Business entity id is required" });
  }

  const query = util.promisify(db.query).bind(db);

  try {
      // Query to get total employees in the given business entity
      const totalEmployeesSql = `
          SELECT COUNT(*) AS totalEmployees
          FROM employees
          WHERE business_entity_id = ? AND is_active = 1;
      `;

      // Query to get today's attendance summary
      const attendanceSql = `
          SELECT 
              SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
              SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count
          FROM attendance_employee
          WHERE date = CURDATE() AND business_entity_id = ?;
      `;

      // Execute both queries in parallel
      const [totalEmployeesResult, attendanceResult] = await Promise.all([
          query(totalEmployeesSql, [business_entity_id]),
          query(attendanceSql, [business_entity_id])
      ]);

      // Construct the response object
      const response = {
          totalEmployees: totalEmployeesResult[0]?.totalEmployees || 0,
          present_count: attendanceResult[0]?.present_count || 0,
          absent_count: attendanceResult[0]?.absent_count || 0
      };

      res.json(response);

  } catch (error) {
      console.error("Error fetching attendance summary:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
}






}

export { hrController };