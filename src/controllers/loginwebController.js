// import db from '../config/db.js';

// class LoginwebController {
//   static async read(req, res) {
//     const emailid = req.body.email;
//     const password = req.body.password;

//     db.query('SELECT * FROM users WHERE email = ? AND password = ?', [emailid, password], async (err, results) => {
//       if (err) {
//         console.error('Error querying MySQL:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//       } else {
//         if (results.length > 0) {
//           const user = results[0];
//           const user_type = user.user_type;
//           const userId = user.id;

//           // **Role-based login (user_type === 0)**
//           if (user_type === 0) {
//             db.query('SELECT role FROM user_business_entity_role_mapping WHERE user_id = ?', [userId], async (err, roleResults) => {
//               if (err) {
//                 console.error('Error querying role ID:', err);
//                 res.status(500).json({ error: 'Internal Server Error' });
//               } else if (!roleResults || roleResults.length === 0) {
//                 res.status(403).json({ error: 'No role assigned to user' });
//               } else {
//                 const roleId = parseInt(roleResults[0].role);

//                 // **Role 1 Logic**
//                 if (roleId === 1) {
//                   db.query('SELECT group_id, business_type, business_name, business_entity_id FROM business_entity WHERE email = ?', [emailid], (err, resId) => {
//                     if (err) {
//                       console.error('Error querying business:', err);
//                       res.status(500).json({ error: 'Internal Server Error' });
//                     } else if (!resId || resId.length === 0) {
//                       res.status(403).json({ error: 'No business entity found for user' });
//                     } else {
//                       req.session.user = user.email;
//                       let userData = {
//                         role: roleId,
//                         userId: userId,
//                         super_role_id: 0 ,
//                         Group_ID: resId[0].group_id,
//                         super_role:'Standard User',
//                         business_type: resId[0].business_type,
//                         business_name: resId[0].business_name,
//                         businessEntityId: resId[0].business_entity_id
//                       };

//                       res.json({ login: true, user: req.session.user, userData,super_role_id: 0 });
//                     }
//                   });

//                 // **Role 3 or 5 Logic**
//                 } else if (roleId === 3 || roleId === 5) {
//                   db.query(
//                     `SELECT 
//                         be.group_id, 
//                         be.business_type, 
//                         be.business_name, 
//                         be.business_entity_id 
//                     FROM users u
//                     JOIN user_business_entity_role_mapping uberm ON u.id = uberm.user_id
//                     JOIN business_entity be ON uberm.business_entity_id = be.business_entity_id
//                     WHERE u.email = ?`, 
//                     [emailid], async (err, resId) => {
//                       if (err) {
//                         console.error('Error querying business entity for role 3 & 5:', err);
//                         res.status(500).json({ error: 'Internal Server Error' });
//                       } else if (!resId || resId.length === 0) {
//                         res.status(403).json({ error: 'No business entity found for user' });
//                       } else {
//                         const businessType = resId[0].business_type.toUpperCase();

//                         // Allow only business type 'RT' for roles 3 and 5
//                         if (businessType !== 'RT') {
//                           res.status(403).json({ error: 'Access denied: Invalid business type for role' });
//                           return;
//                         }

//                         req.session.user = user.email;
//                         let userData = {
//                           role: roleId,
//                           userId: userId,
//                           super_role_id: 0 ,
//                           super_role:'Standard User',
//                           Group_ID: resId[0].group_id,
//                           business_type: businessType,
//                           business_name: resId[0].business_name,
//                           businessEntityId: resId[0].business_entity_id
//                         };

//                         res.json({ login: true, user: req.session.user, userData,super_role_id: 0,isRetail:true });
//                       }
//                     });
//                 } else {
//                   res.status(403).json({ error: 'User has no valid role' });
//                 }
//               }
//             });

//           // **Agent Login (user_type !== 0)**
//           } else {
//             db.query(
//               `SELECT 
//                   a.group_id, 
//                   a.business_entity_id, 
//                   a.business_type, 
//                   a.business_name 
//               FROM agent_login a 
//               JOIN users u ON a.user_id = u.id 
//               WHERE u.email = ?`, 
//               [emailid], async (err, agentResults) => {
//               if (err) {
//                 console.error('Error querying agent login:', err);
//                 res.status(500).json({ error: 'Internal Server Error' });
//               } else if (!agentResults || agentResults.length === 0) {
//                 res.status(403).json({ error: 'No agent details found' });
//               } else {
//                 req.session.user = user.email;
//                 let agentData = {
//                   userId: userId,
//                   Group_ID: agentResults[0].group_id,
//                   business_type: agentResults[0].business_type,
//                   business_name: agentResults[0].business_name,
//                   businessEntityId: agentResults[0].business_entity_id
//                 };

//                 res.json({ 
//                   login: true, 
//                   user: req.session.user, 
//                   agentData
//                 });
//               }
//             });
//           }
//         } else {
//           res.json({ login: false });
//         }
//       }
//     });
//   }
// }

// export { LoginwebController };


import db from '../config/db.js';

class LoginwebController {
  static async read(req, res) {
    const emailid = req.body.email;
    const password = req.body.password;

    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [emailid, password], async (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        if (results.length > 0) {
          const user = results[0];
          const user_type = user.user_type;
          const userId = user.id;

          // **Role-based login (user_type === 0)**
          if (user_type === 0) {
            db.query('SELECT role FROM user_business_entity_role_mapping WHERE user_id = ?', [userId], async (err, roleResults) => {
              if (err) {
                console.error('Error querying role ID:', err);
                res.status(500).json({ error: 'Internal Server Error' });
              } else if (!roleResults || roleResults.length === 0) {
                res.status(403).json({ error: 'No role assigned to user' });
              } else {
                const roleId = roleResults.map(roleObj => parseInt(roleObj.role));
                console.log('User roles:', roleId);

                // **Role 1 Logic**
                if (roleId.includes(1)) {
                  db.query('SELECT group_id, business_type, business_name, business_entity_id FROM business_entity WHERE email = ?', [emailid], (err, resId) => {
                    if (err) {
                      console.error('Error querying business:', err);
                      res.status(500).json({ error: 'Internal Server Error' });
                    } else if (!resId || resId.length === 0) {
                      res.status(403).json({ error: 'No business entity found for user' });
                    } else {
                      req.session.user = user.email;
                      let userData = {
                        role: roleId,
                        userId: userId,
                        super_role_id: 0 ,
                        Group_ID: resId[0].group_id,
                        super_role:'Standard User',
                        business_type: resId[0].business_type,
                        business_name: resId[0].business_name,
                        businessEntityId: resId[0].business_entity_id
                      };

                      res.json({ login: true, user: req.session.user, userData,super_role_id: 0 });
                    }
                  });

                // **Role 3 or 5 Logic**
                } else if (roleId.includes(3) || roleId.includes(5)) {
                  db.query(
                    `SELECT 
                        be.group_id, 
                        be.business_type, 
                        be.business_name, 
                        be.business_entity_id 
                    FROM users u
                    JOIN user_business_entity_role_mapping uberm ON u.id = uberm.user_id
                    JOIN business_entity be ON uberm.business_entity_id = be.business_entity_id
                    WHERE u.email = ?`, 
                    [emailid], async (err, resId) => {
                      if (err) {
                        console.error('Error querying business entity for role 3 & 5:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                      } else if (!resId || resId.length === 0) {
                        res.status(403).json({ error: 'No business entity found for user' });
                      } else {
                        const businessType = resId[0].business_type.toUpperCase();

                        // Allow only business type 'RT' for roles 3 and 5
                        if (businessType !== 'RT') {
                          res.status(403).json({ error: 'Access denied: Invalid business type for role' });
                          return;
                        }

                        req.session.user = user.email;
                        let userData = {
                          role: roleId,
                          userId: userId,
                          super_role_id: 0 ,
                          super_role:'Standard User',
                          Group_ID: resId[0].group_id,
                          business_type: businessType,
                          business_name: resId[0].business_name,
                          businessEntityId: resId[0].business_entity_id
                        };

                        res.json({ login: true, user: req.session.user, userData,super_role_id: 0,isRetail:true });
                      }
                    });
                } else if (roleId.includes(6)|| roleId.includes(2)) {
                  console.log('Processing login for Role 6...');
                  
                  db.query(
                    'SELECT business_entity_id FROM user_business_entity_role_mapping WHERE user_id = ?', 
                    [userId], 
                    (err, entityResults) => {
                      if (err) {
                        console.error('Error querying business entity for Role 6:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                      } else if (!entityResults || entityResults.length === 0) {
                        return res.status(403).json({ error: 'No business entity found for user with role 6' });
                      } else {
                        req.session.user = user.email;
                        let userData = {
                          role: roleId,
                          userId: userId,
                          email: user.email,  // Adding user email
                          name: user.first_name,
                          super_role_id: 0,
                          super_role: 'Standard User',
                          businessEntityId: entityResults[0].business_entity_id, // Fetching business entity
                        };
                
                        return res.json({ login: true, user: req.session.user, userData, super_role_id: 0 });
                      }
                    }
                  );
                } else {
                  res.status(403).json({ error: 'User has no valid role' });
                }
              }
            });

          // **Agent Login (user_type !== 0)**
          } else {
            db.query(
              `SELECT 
                  a.group_id, 
                  a.business_entity_id, 
                  a.business_type, 
                  a.business_name 
              FROM agent_login a 
              JOIN users u ON a.user_id = u.id 
              WHERE u.email = ?`, 
              [emailid], async (err, agentResults) => {
              if (err) {
                console.error('Error querying agent login:', err);
                res.status(500).json({ error: 'Internal Server Error' });
              } else if (!agentResults || agentResults.length === 0) {
                res.status(403).json({ error: 'No agent details found' });
              } else {
                req.session.user = user.email;
                let agentData = {
                  userId: userId,
                  Group_ID: agentResults[0].group_id,
                  business_type: agentResults[0].business_type,
                  business_name: agentResults[0].business_name,
                  businessEntityId: agentResults[0].business_entity_id
                };

                res.json({ 
                  login: true, 
                  user: req.session.user, 
                  agentData
                });
              }
            });
          }
        } else {
          res.json({ login: false });
        }
      }
    });
  }
}

export { LoginwebController };