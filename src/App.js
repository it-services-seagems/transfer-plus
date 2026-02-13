"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const react_router_dom_2 = require("react-router-dom");
const Login_1 = require("./pages/Login");
const Home_1 = require("./pages/Home");
const SupplierForms_1 = require("./pages/SupplierForms");
const CadastroFornecedor_1 = require("./pages/CadastroFornecedor");
const SupplierFormsMS_1 = require("./pages/SupplierFormsMS");
const SupplierFormsS_1 = require("./pages/SupplierFormsS");
const Approval_1 = require("./pages/Approval"); // Importação da tela de aprovação
const SuppliersList_1 = require("./pages/SuppliersList"); // Importação da nova lista de fornecedores
function ProtectedRoute({ children }) {
    const isAuthenticated = sessionStorage.getItem('loginComplete') === 'true';
    return isAuthenticated ? react_1.default.createElement(react_1.default.Fragment, null, children) : react_1.default.createElement(react_router_dom_1.Navigate, { to: "/login", replace: true });
}
// Enhanced AccessControl component that redirects based on user's OU and Group
function AccessControl({ children }) {
    const location = (0, react_router_dom_1.useLocation)();
    const ou = sessionStorage.getItem('ou');
    const groupsString = sessionStorage.getItem('group') || '';
    // Helper function to check if user has a specific group
    const hasGroup = (groupName) => {
        return groupsString.includes(groupName);
    };
    // Determine the expected path based on OU and GROUP
    const getExpectedPath = () => {
        // Recupera o form_type da sessionStorage
        const formType = sessionStorage.getItem('form_type');
        console.log('Form Type do sessionStorage:', formType);
        // Primeiro, verifica o form_type retornado pela API
        if (formType) {
            if (formType === 'MATERIAL') {
                return "/supplierForms";
            }
            else if (formType === 'SERVICO') {
                return "/supplierFormsS";
            }
            else if (formType === 'MATERIAL_SERVICO') {
                return "/supplierFormsMS";
            }
            else if (formType === 'INTERNO') {
                return "/cadastro-fornecedor";
            }
        }
        // Fallback usando OU e grupos
        if (ou === 'SHQ' && hasGroup('Domain Users')) {
            return "/cadastro-fornecedor";
        }
        else if (ou === 'VENDORFLOW') {
            if (hasGroup('VDF_SUPPLIER_SERVICE')) {
                return "/supplierFormsS";
            }
            else if (hasGroup('VDF_SUPPLIER_MATERIAL_SERVICE')) {
                return "/supplierFormsMS";
            }
            else if (hasGroup('VDF_SUPPLIER_MATERIAL')) {
                return "/supplierForms";
            }
            else if (hasGroup('VDF_COORDINATOR') || hasGroup('VDF_MANAGER')) {
                // Admins e Managers são redirecionados para a lista de fornecedores
                return "/suppliers";
            }
        }
        return "/cadastro-fornecedor"; // Default path if no matching condition
    };
    const expectedPath = getExpectedPath();
    // Debug information
    console.log("Current path:", location.pathname);
    console.log("OU:", ou);
    console.log("Groups:", groupsString);
    console.log("Expected path:", expectedPath);
    // Only redirect if we're on home or root path
    if (location.pathname === "/home" || location.pathname === "/") {
        console.log("Redirecting from /home or / to", expectedPath);
        return react_1.default.createElement(react_router_dom_1.Navigate, { to: expectedPath, replace: true });
    }
    // Check if the user is trying to access a page they don't have permission for
    const hasAccess = () => {
        // For SHQ Domain Users
        if (ou === 'SHQ' && hasGroup('Domain Users')) {
            return location.pathname === "/cadastro-fornecedor" || location.pathname === "/home";
        }
        // For VENDORFLOW users
        else if (ou === 'VENDORFLOW') {
            if (hasGroup('VDF_SUPPLIER_SERVICE')) {
                return location.pathname === "/supplierFormsS" || location.pathname === "/home";
            }
            else if (hasGroup('VDF_SUPPLIER_MATERIAL_SERVICE')) {
                return location.pathname === "/supplierFormsMS" || location.pathname === "/home";
            }
            else if (hasGroup('VDF_SUPPLIER_MATERIAL')) {
                return location.pathname === "/supplierForms" || location.pathname === "/home";
            }
            // Para a página de aprovação e lista de fornecedores, verifica se o usuário é admin ou manager
            else if (hasGroup('VDF_ADMIN') || hasGroup('VDF_MANAGER')) {
                return (location.pathname.startsWith("/aprovacao") ||
                    location.pathname === "/suppliers" ||
                    location.pathname === "/home");
            }
        }
        // Default to allow access if no other conditions are met
        return true;
    };
    // If the user doesn't have access to the current route, redirect to their expected path
    if (!hasAccess()) {
        console.log("Access denied to", location.pathname, "redirecting to", expectedPath);
        return react_1.default.createElement(react_router_dom_1.Navigate, { to: expectedPath, replace: true });
    }
    return react_1.default.createElement(react_1.default.Fragment, null, children);
}
const App = () => {
    const [loginComplete, setLoginComplete] = (0, react_1.useState)(() => {
        return sessionStorage.getItem('loginComplete') === 'true';
    });
    const handleLoginComplete = () => {
        setLoginComplete(true);
        sessionStorage.setItem('loginComplete', 'true');
        // Force redirect to the appropriate page based on form_type
        const formType = sessionStorage.getItem('form_type');
        const ou = sessionStorage.getItem('ou');
        const groupsString = sessionStorage.getItem('group') || '';
        let targetPath = "/cadastro-fornecedor"; // Default path
        console.log('Login completo. Form Type:', formType);
        console.log('OU:', ou);
        console.log('Grupos:', groupsString);
        // Primeiro, priorize o form_type retornado pela API
        if (formType) {
            if (formType === 'MATERIAL') {
                targetPath = "/supplierForms";
            }
            else if (formType === 'SERVICO') {
                targetPath = "/supplierFormsS";
            }
            else if (formType === 'MATERIAL_SERVICO') {
                targetPath = "/supplierFormsMS";
            }
            else if (formType === 'INTERNO') {
                targetPath = "/cadastro-fornecedor";
            }
        }
        // Fallback para verificação baseada em grupos
        else if (ou === 'VENDORFLOW') {
            if (groupsString.includes('VDF_SUPPLIER_SERVICE')) {
                targetPath = "/supplierFormsS";
            }
            else if (groupsString.includes('VDF_SUPPLIER_MATERIAL_SERVICE')) {
                targetPath = "/supplierFormsMS";
            }
            else if (groupsString.includes('VDF_SUPPLIER_MATERIAL')) {
                targetPath = "/supplierForms";
            }
            // Se for admin ou manager, redireciona para a lista de fornecedores
            else if (groupsString.includes('VDF_ADMIN') || groupsString.includes('VDF_MANAGER')) {
                targetPath = "/suppliers";
            }
        }
        console.log('Redirecionando para:', targetPath);
        window.location.href = targetPath;
    };
    (0, react_1.useEffect)(() => {
        const isLoggedIn = sessionStorage.getItem('loginComplete') === 'true';
        setLoginComplete(isLoggedIn);
        // Log debug information on mount
        console.log("App mounted");
        console.log("Login complete:", isLoggedIn);
        console.log("OU:", sessionStorage.getItem('ou'));
        console.log("Groups:", sessionStorage.getItem('group'));
    }, []);
    return (react_1.default.createElement(react_router_dom_2.BrowserRouter, null,
        react_1.default.createElement(react_router_dom_2.Routes, null,
            react_1.default.createElement(react_router_dom_2.Route, { path: "/", element: loginComplete ? react_1.default.createElement(react_router_dom_1.Navigate, { to: "/cadastro-fornecedor", replace: true }) : react_1.default.createElement(Login_1.default, { onLoginComplete: handleLoginComplete }) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/login", element: react_1.default.createElement(Login_1.default, { onLoginComplete: handleLoginComplete }) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/home", element: react_1.default.createElement(ProtectedRoute, null,
                    react_1.default.createElement(AccessControl, null,
                        react_1.default.createElement(Home_1.default, null))) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/supplierForms", element: react_1.default.createElement(ProtectedRoute, null,
                    react_1.default.createElement(AccessControl, null,
                        react_1.default.createElement(SupplierForms_1.default, null))) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/supplierFormsS", element: react_1.default.createElement(ProtectedRoute, null,
                    react_1.default.createElement(AccessControl, null,
                        react_1.default.createElement(SupplierFormsS_1.default, null))) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/supplierFormsMS", element: react_1.default.createElement(ProtectedRoute, null,
                    react_1.default.createElement(AccessControl, null,
                        react_1.default.createElement(SupplierFormsMS_1.default, null))) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/cadastro-fornecedor", element: react_1.default.createElement(ProtectedRoute, null,
                    react_1.default.createElement(AccessControl, null,
                        react_1.default.createElement(CadastroFornecedor_1.default, null))) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/suppliers", element: react_1.default.createElement(ProtectedRoute, null,
                    react_1.default.createElement(AccessControl, null,
                        react_1.default.createElement(SuppliersList_1.default, null))) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/aprovacao/:id", element: react_1.default.createElement(ProtectedRoute, null,
                    react_1.default.createElement(AccessControl, null,
                        react_1.default.createElement(Approval_1.default, null))) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "/aprovacao/lista", element: react_1.default.createElement(react_router_dom_1.Navigate, { to: "/suppliers", replace: true }) }),
            react_1.default.createElement(react_router_dom_2.Route, { path: "*", element: react_1.default.createElement(react_router_dom_1.Navigate, { to: loginComplete ? "/cadastro-fornecedor" : "/login", replace: true }) }))));
};
exports.default = App;
