import { Injectable } from '@angular/core';

export class CartItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  price: number;
  priceToShow: string;
  quantity: number;
  total: number;
  product: any;

  setQuantity(newQuantity: number) {
    this.quantity = newQuantity;
    this.total = this.price * this.quantity;
  }

  getTotal(fixFloatingPoint: boolean): number {
    return fixFloatingPoint ? Number(this.total.toFixed(2)) : this.total;
  }

  static fromSaved(savedCartItem: CartItem): CartItem {
    let toReturn = new CartItem();
    toReturn.id = savedCartItem.id;
    toReturn.title = savedCartItem.title;
    toReturn.subtitle = savedCartItem.subtitle;
    toReturn.image = savedCartItem.image;
    toReturn.price = savedCartItem.price;
    toReturn.priceToShow = savedCartItem.priceToShow;
    toReturn.quantity = savedCartItem.quantity;
    toReturn.total = savedCartItem.total;
    toReturn.product = savedCartItem.product;
    return toReturn;
  }
}

export class ExtraCharge {
  id: string;
  title: string;
  price: number;
  isPercent: boolean;
  priceToShow: string;

  // constructor(title: string, price: number, isPercent: boolean, currency: string) {
  //   this.title = title;
  //   this.price = price;
  //   this.calculationType = isPercent ? "percent" : "fixed";
  //   this.priceToShow = currency + " " + this.price.toFixed(2);
  // }
}

export class Cart {
  static KEY_CART: string = 'dw_cart';

  cartItems: Array<CartItem>;
  extraCharges: Array<ExtraCharge>;

  static initialize(): Cart {
    let toReturn = new Cart();
    toReturn.cartItems = new Array<CartItem>();
    toReturn.extraCharges = new Array<ExtraCharge>();

    let savedCart = Cart.getSavedCart();
    if (savedCart) {
      if (savedCart.extraCharges && savedCart.extraCharges.length) toReturn.extraCharges = savedCart.extraCharges;
      if (savedCart.cartItems && savedCart.cartItems.length) for (let sCi of savedCart.cartItems) toReturn.cartItems.push(CartItem.fromSaved(sCi));
    }

    // let tipIndex = -1;
    // for (let i = 0; i < toReturn.extraCharges.length; i++) {
    //   if (toReturn.extraCharges[i].id == "tax_in_percent") {
    //     tipIndex = i;
    //     break;
    //   }
    // }
    // if (tipIndex != -1) toReturn.extraCharges.splice(tipIndex, 1);
    // let tax_in_percent = Helper.getSettingValue("tax_in_percent");
    // if (tax_in_percent != null && Number(tax_in_percent) > 0) {
    //   let ec = new ExtraCharge();
    //   ec.id = "tax_in_percent";
    //   ec.title = "Service Fee";
    //   ec.isPercent = true;
    //   ec.price = Number(tax_in_percent);
    //   ec.priceToShow = ec.price + "%";
    //   toReturn.extraCharges.push(ec);
    // }

    return toReturn;
  }

  getTotalCartItems(fixFloatingPoint: boolean): number {
    let toReturn = 0;
    for (let ci of this.cartItems) toReturn += ci.total;
    return fixFloatingPoint ? Number(toReturn.toFixed(2)) : toReturn;
  }

  getTotalCart(fixFloatingPoint: boolean): number {
    let toReturn = this.getTotalCartItems(false);
    for (let ec of this.extraCharges) if (!ec.isPercent) toReturn += ec.price;
    for (let ec of this.extraCharges) if (ec.isPercent) toReturn += ((toReturn * ec.price) / 100);
    return fixFloatingPoint ? Number(toReturn.toFixed(2)) : toReturn;
  }

  static getSavedCart(): Cart {
    return JSON.parse(window.localStorage.getItem(Cart.KEY_CART));
  }

  static setSavedCart(cartToSave: Cart) {
    window.localStorage.setItem(Cart.KEY_CART, JSON.stringify(cartToSave));
  }
}

@Injectable({
  providedIn: 'root'
})
export class ECommerceService {
  private myCart: Cart;
  // private orderRequest: OrderRequest;

  constructor() {
    this.myCart = Cart.initialize();
  }

  getCartItems(): Array<CartItem> {
    return this.myCart.cartItems;
  }

  getExtraCharges(): Array<ExtraCharge> {
    return this.myCart.extraCharges;
  }

  getCartItemsCount(): number {
    return this.myCart.cartItems.length;
  }

  getCartItemsTotal(fixFloatingPoint: boolean): number {
    return this.myCart.getTotalCartItems(fixFloatingPoint);
  }

  getCartTotal(fixFloatingPoint: boolean): number {
    return this.myCart.getTotalCart(fixFloatingPoint);
  }

  isExistsCartItem(ci: CartItem): boolean {
    let index = -1;
    for (let i = 0; i < this.myCart.cartItems.length; i++) {
      if (this.myCart.cartItems[i].id == ci.id) {
        index = i;
        break;
      }
    }
    return index != -1;
  }

  addOrIncrementCartItem(ci: CartItem): boolean {
    let index = -1;
    for (let i = 0; i < this.myCart.cartItems.length; i++) {
      if (this.myCart.cartItems[i].id == ci.id) {
        index = i;
        break;
      }
    }
    if (index == -1) {
      this.myCart.cartItems.push(ci);
    } else {
      ci.setQuantity(this.myCart.cartItems[index].quantity + 1);
      this.myCart.cartItems[index] = ci;
    }
    Cart.setSavedCart(this.myCart);
    return index == -1;
  }

  removeOrDecrementCartItem(ci: CartItem): boolean {
    let index = -1;
    for (let i = 0; i < this.myCart.cartItems.length; i++) {
      if (this.myCart.cartItems[i].id == ci.id) {
        index = i;
        break;
      }
    }
    let removed = false;
    if (index != -1) {
      if (this.myCart.cartItems[index].quantity > 1) {
        ci.setQuantity(this.myCart.cartItems[index].quantity - 1);
        this.myCart.cartItems[index] = ci;
      } else {
        removed = true;
        this.myCart.cartItems.splice(index, 1);
      }
      Cart.setSavedCart(this.myCart);
    }
    return removed;
  }

  //custom PRODUCT implementation below

  // getCartItemFromProduct(product: Product): CartItem {
  //   let ci = new CartItem();
  //   ci.price = product.price;
  //   ci.title = product.title;
  //   ci.subtitle = product.categories[0].title;
  //   ci.image = product.images[0];
  //   ci.product = product;
  //   ci.id = String(product.id);
  //   ci.setQuantity(1);
  //   return ci;
  // }

  //custom ORDERREQUEST implementation below

  // getOrderRequest(): OrderRequest {
  //   this.orderRequest.products = [];
  //   for (let ci of this.myCart.cartItems) this.orderRequest.products.push({ id: ci.product.id, quantity: ci.quantity });
  //   return this.orderRequest;
  // }

  // setupOrderRequestBase() {
  //   if (this.orderRequest == null) {
  //     this.orderRequest = new OrderRequest();
  //   }
  // }

  // setupOrderRequestAddress(address: MyAddress) {
  //   this.setupOrderRequestBase();
  //   this.orderRequest.address_id = address.id;
  // }

  // setupOrderRequestPaymentMethod(paymentMethod: PaymentMethod) {
  //   this.setupOrderRequestBase();
  //   this.orderRequest.payment_method_id = paymentMethod.id;
  // }

}
