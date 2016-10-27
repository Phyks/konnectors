cozydb = require 'cozydb'


module.exports = Bill = cozydb.getModel 'Bill',
    type: String  # Main type of the bill (check already used types in konnectors)
    subtype: String  # Subtype of the bill (check already defined subtypes)
    date: Date  # Date of the billing
    vendor: String  # Third party from which the bill originates
    amount: Number  # Bill amount
    vat: Number  # VAT part on the bill
    currency: String  # Currency of the bill
    plan: String  # TODO
    pdfurl: String  # Link to the bill document (not necessarily a PDF file)
    binaryId: String  # ID of the file content containing the bill, CouchDB metadata
    fileId: String  # ID of the file doctype containing the bill, CouchDB metadata
    content: String  # TODO
    isRefund: Boolean  # Whether this bill is a refund
    duedate: Date  # Date by which the bill should be paid
    startdate: Date  # Date of the beginning of the billing period (if applicable)
    finishdate: Date  # Date of the end of the billing period (if applicable)


Bill.all = (callback) ->
    Bill.request 'byDate', callback
