package main

type User struct {
	UserName         string `json:"username"`
	AccountReference string `json:"AccountReference"`
	Name             string `json:"firstname"`
	Phone            string `json:"mobilePhone"`
	Email            string `json:"email"`
	Password         string `json:"password"`
	Status           string `json:"status"`
	Category         string `json:"category"` //Seller and Buyer
}

type Response struct {
	Success string `json:"username"`
	Message string `json:"firstname"`
}

type Products struct {
}

type Styles struct {
}

type Inventories struct {
}

type Customers struct {
}

type Suppliers struct {
}

type SalesOrders struct {
}

type PurchaseOrders struct {
}

type Invoices struct {
	Invoice []Invoice `json:"Invoice"`
}

type Invoice struct {
	InvoiceNumber           []string                 `json:"InvoiceNumber"`
	CustomerOrderNumber     []string                 `json:"CustomerOrderNumber"`
	AccountReference        []string                 `json:"AccountReference"`
	OrderNumber             []string                 `json:"OrderNumber"`
	ForeignRate             []string                 `json:"ForeignRate"`
	Notes1                  []string                 `json:"Notes1"`
	Notes2                  []string                 `json:"Notes2"`
	Notes3                  []string                 `json:"Notes3"`
	CurrencyUsed            []string                 `json:"CurrencyUsed"`
	InvoiceDate             []string                 `json:"InvoiceDate"`
	InvoiceAddress          []InvoiceAddress         `json:"InvoiceAddress"`
	InvoiceDeliveryAddress  []InvoiceDeliveryAddress `json:"InvoiceDeliveryAddress"`
	InvoiceItems            []InvoiceItems           `json:"InvoiceItems"`
	ItemsNet                []string                 `json:"ItemsNet"`
	ItemsTax                []string                 `json:"ItemsTax"`
	ItemsTotal              []string                 `json:"ItemsTotal"`
	Carriage                []Carriage               `json:"Carriage"`
	CustomFields            []string                 `json:"CustomFields"`
	InvoiceType             []string                 `json:"InvoiceType"`
	TakenBy                 []string                 `json:"TakenBy"`
	ConsignmentNo           []string                 `json:"ConsignmentNo"`
	Courier                 []string                 `json:"Courier"`
	SettlementDays          []string                 `json:"SettlementDays"`
	NetValueDiscount        []string                 `json:"NetValueDiscount"`
	NetValueDiscountPercent []string                 `json:"NetValueDiscountPercent"`
	DiscountType            []string                 `json:"DiscountType"`
	SettlementDiscount      []string                 `json:"SettlementDiscount"`
	GlobalTaxCode           []string                 `json:"GlobalTaxCode"`
	GlobalDepartment        []string                 `json:"GlobalDepartment"`
	PaymentRef              []string                 `json:"PaymentRef"`
	PaymentAmount           []string                 `json:"PaymentAmount"`
	BankAccount             []string                 `json:"BankAccount"`
	PostedDate              []string                 `json:"PostedDate"`
	PostedFlag              []string                 `json:"PostedFlag"`
	PrintedFlag             []string                 `json:"PrintedFlag"`
	PaidFlag                []string                 `json:"PaidFlag"`
	AmountPaid              []string                 `json:"AmountPaid"`
	TaxNumber               []string                 `json:"TaxNumber"`
}

type Carriage struct {
	QtyOrdered             []string `json:"QtyOrdered"`
	UnitPrice              []string `json:"UnitPrice"`
	UnitDiscountAmount     []string `json:"UnitDiscountAmount"`
	UnitDiscountPercentage []string `json:"UnitDiscountPercentage"`
	TaxRate                []string `json:"TaxRate"`
	CustomFields           []string `json:"CustomFields"`
	TotalNet               []string `json:"TotalNet"`
	TotalTax               []string `json:"TotalTax"`
	Type                   []string `json:"Type"`
	QtyAllocated           []string `json:"QtyAllocated"`
	QtyDespatched          []string `json:"QtyDespatched"`
}

type InvoiceAddress struct {
	Title        []string `json:"Title"`
	Forename     []string `json:"Forename"`
	Surname      []string `json:"Surname"`
	Company      []string `json:"Company"`
	Address1     []string `json:"Address1"`
	Address2     []string `json:"Address2"`
	Address3     []string `json:"Address3"`
	Town         []string `json:"Town"`
	Postcode     []string `json:"Postcode"`
	County       []string `json:"County"`
	Country      []string `json:"Country"`
	Telephone    []string `json:"Telephone"`
	Fax          []string `json:"Fax"`
	Mobile       []string `json:"Mobile"`
	Email        []string `json:"Email"`
	Birthdate    []string `json:"Birthdate"`
	Notes        []string `json:"Notes"`
	TaxCode      []string `json:"TaxCode"`
	CustomFields []string `json:"CustomFields"`
}

type InvoiceDeliveryAddress struct {
	Company      []string `json:"Company"`
	Address1     []string `json:"Address1"`
	Address2     []string `json:"Address2"`
	Address3     []string `json:"Address3"`
	Town         []string `json:"Town"`
	Postcode     []string `json:"Postcode"`
	County       []string `json:"County"`
	Country      []string `json:"Country"`
	Telephone    []string `json:"Telephone"`
	Fax          []string `json:"Fax"`
	Mobile       []string `json:"Mobile"`
	Email        []string `json:"Email"`
	Birthdate    []string `json:"Birthdate"`
	Notes        []string `json:"Notes"`
	TaxCode      []string `json:"TaxCode"`
	CustomFields []string `json:"CustomFields"`
}

type InvoiceItems struct {
	Item []Item `json:"Item"`
}

type Item struct {
	Sku                    []string `json:"Sku"`
	Name                   []string `json:"Name"`
	Description            []string `json:"Description"`
	Comments               []string `json:"Comments"`
	UnitOfSale             []string `json:"UnitOfSale"`
	QtyOrdered             []string `json:"QtyOrdered"`
	UnitPrice              []string `json:"UnitPrice"`
	UnitDiscountAmount     []string `json:"UnitDiscountAmount"`
	UnitDiscountPercentage []string `json:"UnitDiscountPercentage"`
	Reference              []string `json:"Reference"`
	TaxRate                []string `json:"TaxRate"`
	CustomFields           []string `json:"CustomFields"`
	TotalNet               []string `json:"TotalNet"`
	TotalTax               []string `json:"TotalTax"`
	TaxCode                []string `json:"TaxCode"`
	NominalCode            []string `json:"NominalCode"`
	Department             []string `json:"Department"`
	Text                   []string `json:"Text"`
	Type                   []string `json:"Type"`
	QtyAllocated           []string `json:"QtyAllocated"`
	QtyDespatched          []string `json:"QtyDespatched"`
}

type ProductGroups struct {
}

type Transactions struct {
}

type TaxRates struct {
}

type Currencies struct {
}

type PriceLists struct {
}

type StockTransactions struct {
}

type PaymentAllocations struct {
}

type AllocationSessions struct {
}

type InvoiceData struct {
	Products           []string   `json:"Products"`
	Styles             []string   `json:"Styles"`
	Inventories        []string   `json:"Inventories"`
	Customers          []string   `json:"Customers"`
	Suppliers          []string   `json:"Suppliers"`
	SalesOrders        []string   `json:"SalesOrders"`
	PurchaseOrders     []string   `json:"PurchaseOrders"`
	Invoices           []Invoices `json:"Invoices"`
	ProductGroups      []string   `json:"ProductGroups"`
	Transactions       []string   `json:"Transactions"`
	TaxRates           []string   `json:"TaxRates"`
	Currencies         []string   `json:"Currencies"`
	PriceLists         []string   `json:"PriceLists"`
	StockTransactions  []string   `json:"StockTransactions"`
	PaymentAllocations []string   `json:"PaymentAllocations"`
	AllocationSessions []string   `json:"AllocationSessions"`
}

type BuyerInvoiceList struct {
	InvoiceNumber       string `json:"invoiceNumber"`
	AccountReference    string `json:"accountReference"`
	CustomerOrderNumber string `json:"customerOrderNumber"`
	InvoiceDate         string `json:"invoiceDate"`
}
