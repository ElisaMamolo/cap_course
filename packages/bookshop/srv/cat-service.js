const cds = require('@sap/cds')
const { Books } = cds.entities

/** Service implementation for CatalogService */
module.exports = cds.service.impl(function() {
    //after and before handlers
    //inline handling
  this.after ('READ', 'Books', each => each.stock > 111 && _addDiscount2(each,11))
  //or call function
  this.before ('CREATE', 'Orders', _reduceStock)
  // * means for all methods
  // no entity is passed so it is for all entities
  this.before('*', (req) => {
      console.debug('>>>>>>>' + req.method, req.target.name)
      req.error(400, 'testing error method on req object');
      
  })
})

/** Add some discount for overstocked books */
function _addDiscount2 (each,discount) {
  each.title += ` -- ${discount}% discount!`
}

/** Reduce stock of ordered books if available stock suffices */
async function _reduceStock (req) {
  const { Items: OrderItems } = req.data
  return cds.transaction(req) .run (()=> OrderItems.map (order =>
    UPDATE (Books) .set ('stock -=', order.amount)
    .where ('ID =', order.book_ID) .and ('stock >=', order.amount)
  )) .then (all => all.forEach ((affectedRows,i) => {
    if (affectedRows === 0)  req.error (409,
      `${OrderItems[i].amount} exceeds stock for book #${OrderItems[i].book_ID}`
    )
  }))
}