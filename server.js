const mysql = require('mysql2');
const inquirer = require('inquirer');
require('dotenv').config();

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    console.log('Connected to the employees_db database.')
);

const startApp = () => {
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    'View all departments',
                    'View all roles',
                    'View all employees',
                    'Add a department',
                    'Add a role',
                    'Add an employee',
                    'Update an employee role',
                    'Exit',
                ],
            },
        ])
        .then((answer) => {
            switch (answer.action) {
                case 'View all departments':
                    viewDepartments();
                    break;
                case 'View all roles':
                    viewRoles();
                    break;
                case 'View all employees':
                    viewEmployees();
                    break;
                case 'Add a department':
                    addDepartment();
                    break;
                case 'Add a role':
                    addRole();
                    break;
                case 'Add an employee':
                    addEmployee();
                    break;
                case 'Update an employee role':
                    updateEmployeeRole();
                    break;
                case 'Exit':
                    db.end();
                    break;
            }
        });
};

startApp();

const viewDepartments = () => {
    db.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;
        console.table(res);
        startApp();
    });
};

const viewRoles = () => {
    const query = `
    SELECT role.id, role.title, role.salary, department.name AS department FROM role JOIN department ON role.department_id = department.id
  `;
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        startApp();
    });
};

const viewEmployees = () => {
    const query = `
    SELECT employee.id, employee.first_name, employee.last_name, role.title AS job_title, role.salary, department.name AS department, CONCAT(manager.first_name, " ", manager.last_name) AS manager 
    FROM employee 
    INNER JOIN role ON employee.role_id = role.id 
    INNER JOIN department ON role.department_id = department.id 
    LEFT JOIN employee AS manager ON employee.manager_id = manager.id
  `;
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
        startApp();
    });
};

const addDepartment = () => {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter the name of the department:',
            },
        ])
        .then((answer) => {
            db.query(
                'INSERT INTO department (name) VALUES (?)',
                [answer.name],
                (err, res) => {
                    if (err) throw err;
                    console.log('Department added successfully!');
                    startApp();
                }
            );
        });
};

const addRole = () => {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the title of the new role:',
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for the new role:',
            },
            {
                type: 'input',
                name: 'department_id',
                message: 'Enter the department ID for the new role:',
            },
        ])
        .then((answer) => {
            db.query(
                'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)',
                [answer.title, answer.salary, answer.department_id],
                (err, res) => {
                    if (err) throw err;
                    console.log('Role added successfully!');
                    startApp();
                }
            );
        });
};

const addEmployee = () => {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'first_name',
                message: "Enter the employee's first name:",
            },
            {
                type: 'input',
                name: 'last_name',
                message: "Enter the employee's last name:",
            },
            {
                type: 'input',
                name: 'role_id',
                message: "Enter the role ID for the employee:",
            },
            {
                type: 'input',
                name: 'manager_id',
                message: "Enter the manager's ID for the employee (or leave empty if none):",
            },
        ])
        .then((answer) => {
            db.query(
                'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)',
                [answer.first_name, answer.last_name, answer.role_id, answer.manager_id || null],
                (err, res) => {
                    if (err) throw err;
                    console.log('Employee added successfully!');
                    startApp();
                }
            );
        });
};

const updateEmployeeRole = () => {
    db.query('SELECT id, first_name, last_name FROM employee', (err, employees) => {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'employeeId',
                    message: 'Select the employee you want to update:',
                    choices: employees.map((employee) => ({
                        name: `${employee.first_name} ${employee.last_name}`,
                        value: employee.id,
                    })),
                },
                {
                    type: 'input',
                    name: 'newRoleId',
                    message: 'Enter the new role ID for the employee:',
                },
            ])
            .then((answer) => {
                db.query(
                    'UPDATE employee SET role_id = ? WHERE id = ?',
                    [answer.newRoleId, answer.employeeId],
                    (err, res) => {
                        if (err) throw err;
                        console.log('Employee role updated successfully!');
                        startApp();
                    }
                );
            });
    });
};
