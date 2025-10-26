// ===== CONFIGURATION iDREAM =====
class iDreamFinance {
    constructor() {
        this.transactions = this.loadData('idream_transactions') || [];
        this.products = this.loadData('idream_products') || [];
        this.categories = this.loadData('idream_categories') || this.getDefaultCategories();
        this.charts = {};
        this.currentPeriod = 'month';
        
        this.init();
    }

    init() {
        console.log('🌙 iDream Finance - Initialisation');
        this.setMinDate();
        this.populateCategoryFilters();
        this.populateProductSelects();
        this.renderDashboard();
        this.setupEventListeners();
        this.initCharts();
    }

    // ===== CONFIGURATION DES CATÉGORIES =====
    getDefaultCategories() {
        return [
            // DÉPENSES
            { id: 1, name: 'Matières premières', type: 'expense', color: '#FF6B6B' },
            { id: 2, name: 'Emballages', type: 'expense', color: '#4ECDC4' },
            { id: 3, name: 'Équipement production', type: 'expense', color: '#45B7D1' },
            { id: 4, name: 'Transport livraison', type: 'expense', color: '#96CEB4' },
            { id: 5, name: 'Marketing publicité', type: 'expense', color: '#FFEAA7' },
            { id: 6, name: 'Salaires équipe', type: 'expense', color: '#DDA0DD' },
            { id: 7, name: 'Loyer & Charges', type: 'expense', color: '#FFA07A' },
            { id: 8, name: 'Services divers', type: 'expense', color: '#20B2AA' },
            
            // REVENUS
            { id: 9, name: 'Vente 4en1', type: 'revenue', color: '#6A0DAD' },
            { id: 10, name: 'Vente chips', type: 'revenue', color: '#8A2BE2' },
            { id: 11, name: 'Vente arachides', type: 'revenue', color: '#9370DB' },
            { id: 12, name: 'Vente popcorn', type: 'revenue', color: '#BA55D3' },
            { id: 13, name: 'Vente en gros', type: 'revenue', color: '#DA70D6' },
            { id: 14, name: 'Vente détail', type: 'revenue', color: '#EE82EE' }
        ];
    }

    // ===== GESTION DES ÉVÉNEMENTS =====
    setupEventListeners() {
        // Formulaire transaction
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Formulaire produit
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Filtres
        document.getElementById('typeFilter').addEventListener('change', () => this.filterTransactions());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterTransactions());
        document.getElementById('dateFilter').addEventListener('change', () => this.filterTransactions());

        // Période
        document.getElementById('periodSelect').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.updateDashboard();
        });
    }

    // ===== GESTION DES TRANSACTIONS =====
    addTransaction() {
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const description = document.getElementById('transactionDescription').value.trim();
        const category = parseInt(document.getElementById('transactionCategory').value);
        const product = document.getElementById('transactionProduct').value;
        const date = document.getElementById('transactionDate').value;

        // Validation
        if (!type || !amount || !description || !category || !date) {
            this.showAlert('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        if (amount <= 0) {
            this.showAlert('Le montant doit être supérieur à 0', 'error');
            return;
        }

        const transaction = {
            id: Date.now() + Math.random(),
            type: type,
            amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
            description: description,
            category: category,
            product: product,
            date: date,
            timestamp: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.saveData('idream_transactions', this.transactions);
        
        this.showAlert('Transaction enregistrée avec succès!', 'success');
        this.renderDashboard();
        this.closeTransactionModal();
        this.resetTransactionForm();
    }

    deleteTransaction(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData('idream_transactions', this.transactions);
            this.renderDashboard();
            this.showAlert('Transaction supprimée', 'success');
        }
    }

    // ===== GESTION DES PRODUITS =====
    addProduct() {
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const cost = parseFloat(document.getElementById('productCost').value);
        const description = document.getElementById('productDescription').value.trim();

        if (!name || !price || !cost) {
            this.showAlert('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        if (price <= 0 || cost <= 0) {
            this.showAlert('Le prix et le coût doivent être supérieurs à 0', 'error');
            return;
        }

        // Validation moins stricte pour les coûts
        if (cost > price) {
            if (!confirm('Attention : Le coût est supérieur au prix de vente. Voulez-vous quand même ajouter le produit ?')) {
                return;
            }
        }

        const product = {
            id: Date.now() + Math.random(),
            name: name,
            price: price,
            cost: cost,
            description: description,
            sales: 0,
            revenue: 0
        };

        this.products.push(product);
        this.saveData('idream_products', this.products);
        
        this.showAlert('Produit ajouté avec succès!', 'success');
        this.renderProducts();
        this.closeProductModal();
        this.resetProductForm();
        this.populateProductSelects();
    }

    deleteProduct(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveData('idream_products', this.products);
            this.renderProducts();
            this.populateProductSelects();
            this.showAlert('Produit supprimé', 'success');
        }
    }

    updateProductSales() {
        // Mettre à jour les ventes des produits basé sur les transactions
        this.products.forEach(product => {
            const productTransactions = this.transactions.filter(t => 
                t.product === product.name && t.amount > 0
            );
            
            product.sales = productTransactions.length;
            product.revenue = productTransactions.reduce((sum, t) => sum + t.amount, 0);
        });
        
        this.saveData('idream_products', this.products);
    }

    // ===== CALCULS FINANCIERS =====
    calculateFinancials(period = this.currentPeriod) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'today':
                startDate = new Date(now);
                endDate = new Date(now);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                endDate = new Date(now);
                endDate.setDate(now.getDate() + (6 - now.getDay()));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        const periodTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        const totalRevenue = periodTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = periodTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

        // Répartition bénéfices (Article 6 du contrat)
        const collaboratorsShare = netProfit > 0 ? netProfit * 0.45 : 0;
        const dreamTreasury = netProfit > 0 ? netProfit * 0.55 : 0;

        // Calcul des tendances
        const previousPeriodData = this.calculatePreviousPeriodData(period);
        const revenueTrend = previousPeriodData.revenue > 0 ? 
            ((totalRevenue - previousPeriodData.revenue) / previousPeriodData.revenue * 100) : 0;
        const expenseTrend = previousPeriodData.expenses > 0 ? 
            ((totalExpenses - previousPeriodData.expenses) / previousPeriodData.expenses * 100) : 0;
        const profitTrend = previousPeriodData.profit !== 0 ? 
            ((netProfit - previousPeriodData.profit) / Math.abs(previousPeriodData.profit) * 100) : 0;

        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            collaboratorsShare,
            dreamTreasury,
            periodTransactions,
            revenueTrend,
            expenseTrend,
            profitTrend,
            marginTrend: profitMargin - previousPeriodData.margin
        };
    }

    calculatePreviousPeriodData(currentPeriod) {
        // Simulation de données précédentes pour les tendances
        const baseRevenue = 150000;
        const baseExpenses = 90000;
        
        return {
            revenue: baseRevenue,
            expenses: baseExpenses,
            profit: baseRevenue - baseExpenses,
            margin: ((baseRevenue - baseExpenses) / baseRevenue * 100)
        };
    }

    // ===== FILTRES ET RECHERCHE =====
    getFilteredTransactions() {
        const typeFilter = document.getElementById('typeFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        let filtered = [...this.transactions];

        if (typeFilter) {
            filtered = filtered.filter(t => 
                typeFilter === 'revenue' ? t.amount > 0 : t.amount < 0
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === parseInt(categoryFilter));
        }

        if (dateFilter) {
            filtered = filtered.filter(t => t.date === dateFilter);
        }

        // Tri par date (plus récent en premier)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    filterTransactions() {
        const filteredTransactions = this.getFilteredTransactions();
        this.renderTransactionsTable(filteredTransactions);
        this.updateTransactionsSummary(filteredTransactions);
    }

    clearFilters() {
        document.getElementById('typeFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('dateFilter').value = '';
        this.filterTransactions();
    }

    // ===== RENDU DE L'INTERFACE =====
    renderDashboard() {
        const financials = this.calculateFinancials();
        
        // Mise à jour des statistiques
        document.getElementById('totalRevenue').textContent = 
            this.formatCurrency(financials.totalRevenue);
        document.getElementById('totalExpenses').textContent = 
            this.formatCurrency(financials.totalExpenses);
        document.getElementById('netProfit').textContent = 
            this.formatCurrency(financials.netProfit);
        document.getElementById('profitMargin').textContent = 
            `${financials.profitMargin.toFixed(1)}%`;

        // Tendances
        this.updateTrend('revenueTrend', financials.revenueTrend);
        this.updateTrend('expenseTrend', financials.expenseTrend);
        this.updateTrend('profitTrend', financials.profitTrend);
        this.updateTrend('marginTrend', financials.marginTrend, true);

        // Répartition bénéfices
        document.getElementById('collaboratorsShare').textContent = 
            this.formatCurrency(financials.collaboratorsShare);
        document.getElementById('dreamTreasury').textContent = 
            this.formatCurrency(financials.dreamTreasury);

        // Mise à jour des autres sections
        this.renderTransactionsTable();
        this.renderProducts();
        this.updateCharts();
    }

    updateTrend(elementId, value, isMargin = false) {
        const element = document.getElementById(elementId);
        const absValue = Math.abs(value);
        
        if (value > 0) {
            element.innerHTML = `<span class="positive">+${isMargin ? value.toFixed(1) + 'pts' : absValue.toFixed(1) + '%'} vs période précédente</span>`;
        } else if (value < 0) {
            element.innerHTML = `<span class="negative">-${isMargin ? Math.abs(value).toFixed(1) + 'pts' : absValue.toFixed(1) + '%'} vs période précédente</span>`;
        } else {
            element.innerHTML = `<span>Stable vs période précédente</span>`;
        }
    }

    renderTransactionsTable(transactions = null) {
        const tbody = document.getElementById('transactionsTableBody');
        const data = transactions || this.getFilteredTransactions();

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="icon">📝</div>
                        <div>Aucune transaction trouvée</div>
                        <button class="btn btn-primary" onclick="openTransactionModal()" style="margin-top: 1rem;">
                            + Ajouter une transaction
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            const isExpense = transaction.amount < 0;
            const amountClass = isExpense ? 'negative' : 'positive';
            const amountDisplay = Math.abs(transaction.amount);
            const typeText = isExpense ? 'Dépense' : 'Revenu';

            return `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <span class="category-badge" style="background: ${category?.color || '#666'}">
                            ${category?.name || 'Non catégorisé'}
                        </span>
                    </td>
                    <td>${typeText}</td>
                    <td class="${amountClass}">
                        ${this.formatCurrency(amountDisplay)}
                    </td>
                    <td>
                        <button class="btn btn-danger" onclick="dreamFinance.deleteTransaction(${transaction.id})">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateTransactionsSummary(transactions) {
        const revenue = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const balance = revenue - expenses;

        document.getElementById('filteredRevenue').textContent = this.formatCurrency(revenue);
        document.getElementById('filteredExpenses').textContent = this.formatCurrency(expenses);
        document.getElementById('filteredBalance').textContent = this.formatCurrency(balance);
        document.getElementById('filteredBalance').className = balance >= 0 ? 'positive' : 'negative';
    }

    renderProducts() {
        this.updateProductSales();
        const grid = document.getElementById('productsGrid');

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🍿</div>
                    <div>Aucun produit configuré</div>
                    <button class="btn btn-primary" onclick="openProductModal()" style="margin-top: 1rem;">
                        + Ajouter un produit
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(product => {
            const margin = ((product.price - product.cost) / product.price) * 100;
            const marginClass = margin >= 50 ? 'excellent' : margin >= 30 ? 'positive' : margin >= 10 ? 'low' : 'negative';
            const revenue = product.revenue || 0;

            return `
                <div class="product-card">
                    <div class="product-actions">
                        <button onclick="dreamFinance.deleteProduct(${product.id})" title="Supprimer">🗑️</button>
                    </div>
                    <div class="product-header">
                        <h3>${product.name}</h3>
                        ${product.sales > 100 ? '<span class="product-badge best-seller">★ Best-seller</span>' : ''}
                    </div>
                    <div class="product-price">${this.formatCurrency(product.price)}</div>
                    <div class="product-cost">Coût: ${this.formatCurrency(product.cost)}</div>
                    <div class="product-margin ${marginClass}">Marge: ${margin.toFixed(1)}%</div>
                    ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                    <div class="product-stats">
                        <span>Ventes: ${product.sales}</span>
                        <span>Revenu: ${this.formatCurrency(revenue)}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.updateProductsStats();
    }

    updateProductsStats() {
        if (this.products.length === 0) {
            document.getElementById('mostProfitableProduct').textContent = '-';
            document.getElementById('bestMarginProduct').textContent = '-';
            return;
        }

        const mostProfitable = this.products.reduce((max, product) => 
            (product.revenue > max.revenue) ? product : max, this.products[0]);
        
        const bestMargin = this.products.reduce((max, product) => {
            const margin = ((product.price - product.cost) / product.price) * 100;
            const maxMargin = ((max.price - max.cost) / max.price) * 100;
            return margin > maxMargin ? product : max;
        }, this.products[0]);

        document.getElementById('mostProfitableProduct').textContent = 
            `${mostProfitable.name} (${this.formatCurrency(mostProfitable.revenue)})`;
        document.getElementById('bestMarginProduct').textContent = 
            `${bestMargin.name} (${(((bestMargin.price - bestMargin.cost) / bestMargin.price) * 100).toFixed(1)}%)`;
    }

    // ===== GRAPHIQUES =====
    initCharts() {
        this.initRevenueExpenseChart();
        this.initExpensesChart();
    }

    initRevenueExpenseChart() {
        const ctx = document.getElementById('revenueExpenseChart').getContext('2d');
        this.charts.revenueExpense = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                datasets: [
                    {
                        label: 'Revenus',
                        data: [0, 0, 0, 0, 0, 0],
                        borderColor: '#6A0DAD',
                        backgroundColor: 'rgba(106, 13, 173, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Dépenses',
                        data: [0, 0, 0, 0, 0, 0],
                        borderColor: '#FF6B6B',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                }
            }
        });
    }

    initExpensesChart() {
        const ctx = document.getElementById('expensesChart').getContext('2d');
        this.charts.expenses = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: 'white'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return context.label + ': ' + value.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        this.updateRevenueExpenseChart();
        this.updateExpensesChart();
    }

    updateRevenueExpenseChart() {
        if (!this.charts.revenueExpense) return;

        // Données basées sur les transactions réelles
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
        const currentMonth = new Date().getMonth();
        
        const revenueData = months.map((month, index) => {
            if (index > currentMonth) return 0;
            
            const monthTransactions = this.transactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === index && t.amount > 0;
            });
            
            return monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        });

        const expenseData = months.map((month, index) => {
            if (index > currentMonth) return 0;
            
            const monthTransactions = this.transactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === index && t.amount < 0;
            });
            
            return monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        });

        this.charts.revenueExpense.data.labels = months;
        this.charts.revenueExpense.data.datasets[0].data = revenueData;
        this.charts.revenueExpense.data.datasets[1].data = expenseData;
        this.charts.revenueExpense.update();
    }

    updateExpensesChart() {
        if (!this.charts.expenses) return;

        const expenseCategories = this.categories.filter(c => c.type === 'expense');
        const expenseData = expenseCategories.map(category => {
            const categoryExpenses = this.transactions
                .filter(t => t.category === category.id && t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            return categoryExpenses;
        });

        this.charts.expenses.data.labels = expenseCategories.map(c => c.name);
        this.charts.expenses.data.datasets[0].data = expenseData;
        this.charts.expenses.data.datasets[0].backgroundColor = expenseCategories.map(c => c.color);
        this.charts.expenses.update();
    }

    // ===== RAPPORTS =====
    generateMonthlyReport() {
        const financials = this.calculateFinancials();
        
        // Bilan du mois
        document.getElementById('monthlyReport').innerHTML = `
            <div class="report-item">
                <span>Chiffre d'affaires:</span>
                <strong>${this.formatCurrency(financials.totalRevenue)}</strong>
            </div>
            <div class="report-item">
                <span>Dépenses totales:</span>
                <strong>${this.formatCurrency(financials.totalExpenses)}</strong>
            </div>
            <div class="report-item">
                <span>Bénéfice net:</span>
                <strong class="${financials.netProfit >= 0 ? 'positive' : 'negative'}">
                    ${this.formatCurrency(financials.netProfit)}
                </strong>
            </div>
            <div class="report-item">
                <span>Marge bénéficiaire:</span>
                <strong class="${financials.profitMargin >= 20 ? 'positive' : 'negative'}">
                    ${financials.profitMargin.toFixed(1)}%
                </strong>
            </div>
            <div class="report-item">
                <span>Nombre de transactions:</span>
                <strong>${financials.periodTransactions.length}</strong>
            </div>
        `;

        // Top dépenses
        const topExpenses = this.transactions
            .filter(t => t.amount < 0)
            .sort((a, b) => a.amount - b.amount)
            .slice(0, 5);

        document.getElementById('topExpenses').innerHTML = topExpenses.length > 0 ? 
            topExpenses.map(expense => {
                const category = this.categories.find(c => c.id === expense.category);
                return `
                    <div class="expense-item">
                        <div class="expense-description">${expense.description}</div>
                        <div class="expense-amount negative">${this.formatCurrency(Math.abs(expense.amount))}</div>
                        <div class="expense-category">${category?.name || 'Non catégorisé'}</div>
                    </div>
                `;
            }).join('') : '<p style="color: #666; text-align: center;">Aucune dépense enregistrée</p>';

        // Recommandations
        this.renderStrategicRecommendations();

        // Rapport détaillé
        this.renderDetailedReport();

        showSection('reports');
    }

    renderStrategicRecommendations() {
        const financials = this.calculateFinancials();
        let recommendations = [];

        if (financials.profitMargin < 15) {
            recommendations.push('Optimiser les coûts de production pour améliorer la marge bénéficiaire');
        }

        if (financials.totalExpenses > financials.totalRevenue * 0.7) {
            recommendations.push('Réviser les dépenses opérationnelles et identifier des économies');
        }

        if (financials.netProfit < 0) {
            recommendations.push('Développer une stratégie pour augmenter les revenus et réduire les pertes');
        }

        const lowMarginProducts = this.products.filter(p => {
            const margin = ((p.price - p.cost) / p.price) * 100;
            return margin < 20;
        });

        if (lowMarginProducts.length > 0) {
            recommendations.push(`Revoir les prix ou coûts des produits: ${lowMarginProducts.map(p => p.name).join(', ')}`);
        }

        if (recommendations.length === 0) {
            recommendations.push('Performance financière satisfaisante - Maintenir la stratégie actuelle');
            recommendations.push('Envisager des investissements pour la croissance future');
        }

        document.getElementById('strategicRecommendations').innerHTML = recommendations
            .map(rec => `<div class="recommendation">✅ ${rec}</div>`)
            .join('');
    }

    renderDetailedReport() {
        const financials = this.calculateFinancials();
        const content = document.getElementById('detailedReportContent');
        
        content.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h4>Détail par Catégorie</h4>
                ${this.getCategoryBreakdown()}
            </div>
            <div>
                <h4>Performance des Produits</h4>
                ${this.getProductsPerformance()}
            </div>
        `;
    }

    getCategoryBreakdown() {
        let html = '<div class="report-content">';
        
        this.categories.forEach(category => {
            const categoryTransactions = this.transactions.filter(t => t.category === category.id);
            const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            if (categoryTransactions.length > 0) {
                html += `
                    <div class="report-item">
                        <span>${category.name}:</span>
                        <strong class="${total >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(Math.abs(total))} (${categoryTransactions.length} transactions)
                        </strong>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }

    getProductsPerformance() {
        if (this.products.length === 0) {
            return '<p style="color: #666; text-align: center;">Aucun produit configuré</p>';
        }

        let html = '<div class="report-content">';
        this.products.forEach(product => {
            const margin = ((product.price - product.cost) / product.price) * 100;
            html += `
                <div class="report-item">
                    <span>${product.name}:</span>
                    <strong>${margin.toFixed(1)}% de marge (${this.formatCurrency(product.revenue)})</strong>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // ===== EXPORT PDF =====
    exportToPDF() {
        const financials = this.calculateFinancials();
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR');
        
        // Création du contenu PDF
        let pdfContent = `
            <html>
            <head>
                <title>Rapport iDream - ${dateStr}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                    .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                    .positive { color: green; }
                    .negative { color: red; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌙 iDream Finance - Rapport Mensuel</h1>
                    <p>Date: ${dateStr}</p>
                    <p>Généré par: BABATON Ninon D.</p>
                </div>

                <div class="section">
                    <h2>📊 Aperçu Financier</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Chiffre d'Affaires</h3>
                            <p>${this.formatCurrency(financials.totalRevenue)}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Dépenses Total</h3>
                            <p>${this.formatCurrency(financials.totalExpenses)}</p>
                        </div>
                        <div class="stat-card">
                            <h3>Bénéfice Net</h3>
                            <p class="${financials.netProfit >= 0 ? 'positive' : 'negative'}">
                                ${this.formatCurrency(financials.netProfit)}
                            </p>
                        </div>
                        <div class="stat-card">
                            <h3>Marge Bénéficiaire</h3>
                            <p class="${financials.profitMargin >= 20 ? 'positive' : 'negative'}">
                                ${financials.profitMargin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>📋 Répartition des Bénéfices</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>45% Collaborateurs</h3>
                            <p>${this.formatCurrency(financials.collaboratorsShare)}</p>
                        </div>
                        <div class="stat-card">
                            <h3>55% iDream Trésorerie</h3>
                            <p>${this.formatCurrency(financials.dreamTreasury)}</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>📈 Transactions Récentes</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Catégorie</th>
                                <th>Montant</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Ajouter les 10 dernières transactions
        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        recentTransactions.forEach(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            pdfContent += `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>${category?.name || 'Non catégorisé'}</td>
                    <td class="${transaction.amount >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(Math.abs(transaction.amount))}
                    </td>
                </tr>
            `;
        });

        pdfContent += `
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>🍿 Performance des Produits</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Prix</th>
                                <th>Coût</th>
                                <th>Marge</th>
                                <th>Ventes</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        this.products.forEach(product => {
            const margin = ((product.price - product.cost) / product.price) * 100;
            pdfContent += `
                <tr>
                    <td>${product.name}</td>
                    <td>${this.formatCurrency(product.price)}</td>
                    <td>${this.formatCurrency(product.cost)}</td>
                    <td>${margin.toFixed(1)}%</td>
                    <td>${product.sales}</td>
                </tr>
            `;
        });

        pdfContent += `
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>🎯 Recommandations</h2>
                    <ul>
        `;

        this.renderStrategicRecommendations();
        const recommendations = document.getElementById('strategicRecommendations').innerHTML;
        const recItems = recommendations.split('</div>').filter(item => item.trim());
        
        recItems.forEach(item => {
            const text = item.replace('<div class="recommendation">✅', '').trim();
            if (text) {
                pdfContent += `<li>${text}</li>`;
            }
        });

        pdfContent += `
                    </ul>
                </div>

                <div class="section">
                    <p><em>Rapport généré automatiquement par iDream Finance</em></p>
                    <p><strong>iDream Company - Un snack, un sourire, un rêve</strong></p>
                </div>
            </body>
            </html>
        `;

        // Ouvrir dans une nouvelle fenêtre pour impression
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé puis imprimer
        setTimeout(() => {
            printWindow.print();
            this.showAlert('Rapport PDF généré avec succès!', 'success');
        }, 500);
    }

    // ===== ANALYSE STRATÉGIQUE =====
    analyzePerformance() {
        const financials = this.calculateFinancials();
        
        // Analyse des coûts
        const costAnalysis = this.getCostAnalysis();
        document.getElementById('costAnalysis').innerHTML = costAnalysis;

        // Opportunités de croissance
        const growthOpportunities = this.getGrowthOpportunities();
        document.getElementById('growthOpportunities').innerHTML = growthOpportunities;

        // Optimisation financière
        const financialOptimization = this.getFinancialOptimization();
        document.getElementById('financialOptimization').innerHTML = financialOptimization;

        // Plan d'action
        this.generateActionPlan();

        showSection('strategy');
    }

    getCostAnalysis() {
        const financials = this.calculateFinancials();
        let analysis = [];

        if (financials.totalExpenses > financials.totalRevenue * 0.6) {
            analysis.push('Les dépenses représentent une part importante du chiffre d\'affaires');
        }

        const highCostCategories = this.categories.filter(category => {
            const categoryTotal = this.transactions
                .filter(t => t.category === category.id && t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            return categoryTotal > financials.totalExpenses * 0.2;
        });

        if (highCostCategories.length > 0) {
            analysis.push(`Catégories à coûts élevés: ${highCostCategories.map(c => c.name).join(', ')}`);
        }

        if (analysis.length === 0) {
            analysis.push('Structure de coûts équilibrée');
        }

        return analysis.map(item => `<div class="analysis-item">📊 ${item}</div>`).join('');
    }

    getGrowthOpportunities() {
        let opportunities = [];

        if (this.products.length < 5) {
            opportunities.push('Diversifier l\'offre de produits iDream');
        }

        const bestProduct = this.products.reduce((max, product) => 
            product.revenue > max.revenue ? product : max, this.products[0]);
        
        if (bestProduct) {
            opportunities.push(`Développer le produit ${bestProduct.name} (best-seller)`);
        }

        if (this.transactions.filter(t => t.amount > 0).length < 50) {
            opportunities.push('Augmenter le volume des ventes');
        }

        if (opportunities.length === 0) {
            opportunities.push('Étudier de nouveaux marchés ou canaux de distribution');
        }

        return opportunities.map(opp => `<div class="opportunity-item">🚀 ${opp}</div>`).join('');
    }

    getFinancialOptimization() {
        let optimizations = [];

        const currentMargin = this.calculateFinancials().profitMargin;
        if (currentMargin < 25) {
            optimizations.push('Améliorer la marge bénéficiaire par une optimisation des coûts');
        }

        const inventoryValue = this.products.reduce((sum, product) => sum + product.cost * 10, 0);
        if (inventoryValue > 100000) {
            optimizations.push('Optimiser la gestion des stocks pour réduire les coûts de possession');
        }

        if (optimizations.length === 0) {
            optimizations.push('Maintenir l\'efficacité financière actuelle');
        }

        return optimizations.map(opt => `<div class="optimization-item">💰 ${opt}</div>`).join('');
    }

    generateActionPlan() {
        const actions = [
            'Réviser les coûts de production mensuellement',
            'Analyser la performance des produits chaque trimestre',
            'Développer un nouveau produit iDream',
            'Optimiser les processus de production',
            'Étudier les opportunités de marché'
        ];

        const content = document.getElementById('actionPlanContent');
        content.innerHTML = actions.map((action, index) => `
            <div class="action-item">
                <input type="checkbox" id="action-${index}">
                <label for="action-${index}">${action}</label>
            </div>
        `).join('');
    }

    // ===== WHATSAPP =====
    contactManagement() {
        const financials = this.calculateFinancials();
        const message = `Bonjour Direction iDream,

Rapport financier du ${new Date().toLocaleDateString('fr-FR')}:

📊 Chiffre d'affaires: ${this.formatCurrency(financials.totalRevenue)}
💰 Dépenses totales: ${this.formatCurrency(financials.totalExpenses)}
💸 Bénéfice net: ${this.formatCurrency(financials.netProfit)}
🎯 Marge: ${financials.profitMargin.toFixed(1)}%

Points importants à discuter.

Cordialement,
BABATON Ninon D.
Pôle Gestion Financière`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/22897051058?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }

    // ===== UTILITAIRES =====
    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    setMinDate() {
        const dateInput = document.getElementById('transactionDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.max = today;
    }

    populateCategoryFilters() {
        const categorySelect = document.getElementById('transactionCategory');
        const categoryFilter = document.getElementById('categoryFilter');
        
        const expenseCategories = this.categories.filter(c => c.type === 'expense');
        
        categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>' +
            expenseCategories.map(cat => 
                `<option value="${cat.id}">${cat.name}</option>`
            ).join('');
        
        categoryFilter.innerHTML = '<option value="">Toutes catégories</option>' + 
            this.categories.map(cat => 
                `<option value="${cat.id}">${cat.name}</option>`
            ).join('');
    }

    populateProductSelects() {
        const productSelect = document.getElementById('transactionProduct');
        
        productSelect.innerHTML = '<option value="">Non spécifié</option>' +
            this.products.map(product => 
                `<option value="${product.name}">${product.name}</option>`
            ).join('');
    }

    showAlert(message, type) {
        const alert = document.getElementById('alert');
        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'block';

        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur de chargement des données:', error);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Erreur de sauvegarde des données:', error);
            this.showAlert('Erreur de sauvegarde des données', 'error');
        }
    }

    resetTransactionForm() {
        document.getElementById('transactionForm').reset();
        this.setMinDate();
    }

    resetProductForm() {
        document.getElementById('productForm').reset();
    }
}

// ===== FONCTIONS GLOBALES =====
let dreamFinance;

function showSection(sectionName) {
    // Cacher toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Désactiver tous les boutons de navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Afficher la section sélectionnée
    document.getElementById(sectionName).classList.add('active');
    
    // Activer le bouton correspondant
    event.target.classList.add('active');
}

function openTransactionModal() {
    document.getElementById('transactionModal').style.display = 'block';
}

function closeTransactionModal() {
    document.getElementById('transactionModal').style.display = 'none';
}

function openProductModal() {
    document.getElementById('productModal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function toggleTransactionFields() {
    const type = document.getElementById('transactionType').value;
    const descriptionLabel = document.getElementById('descriptionLabel');
    
    if (type === 'revenue') {
        descriptionLabel.textContent = 'Source du revenu *';
    } else {
        descriptionLabel.textContent = 'Description de la dépense *';
    }
}

function updateDashboard() {
    dreamFinance.renderDashboard();
}

function exportToPDF() {
    dreamFinance.exportToPDF();
}

function generateMonthlyReport() {
    dreamFinance.generateMonthlyReport();
}

function analyzePerformance() {
    dreamFinance.analyzePerformance();
}

function clearFilters() {
    dreamFinance.clearFilters();
}

function contactManagement() {
    dreamFinance.contactManagement();
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    dreamFinance = new iDreamFinance();
    
    // Service Worker pour PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    }
});

// Fermer les modales en cliquant à l'extérieur
window.onclick = function(event) {
    const transactionModal = document.getElementById('transactionModal');
    const productModal = document.getElementById('productModal');
    
    if (event.target === transactionModal) {
        closeTransactionModal();
    }
    if (event.target === productModal) {
        closeProductModal();
    }
}