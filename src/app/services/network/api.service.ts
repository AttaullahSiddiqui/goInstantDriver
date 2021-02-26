import { Injectable, Inject } from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Country } from 'src/models/country.models';
import { AuthResponse } from 'src/models/auth-response.models';
import { SocialLoginRequest } from 'src/models/sociallogin-request.models';
import { SignUpRequest } from 'src/models/auth-signup-request.models';
import { MyMeta } from 'src/models/meta.models';
import { User } from 'src/models/user.models';
import { BaseListResponse } from 'src/models/base-list.models';
import { SupportRequest } from 'src/models/support-request.models';
import { Helper } from 'src/models/helper.models';
import { Profile } from 'src/models/profile.models';
import { Order } from 'src/models/order.models';
import { OrderRequest } from 'src/models/order-request.models';
import { WalletTransaction } from 'src/models/wallet-transaction.models';
import { PayoutRequest } from 'src/models/payout-request.models';
import { Faq } from 'src/models/faq.models';
import { EarningInsight } from 'src/models/insight-earning.models';
import { OrderInsight } from 'src/models/insight-order.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private myHeaders: HttpHeaders;

  private currency_icon: string;
  private locale: string;
  private uuid: string = "xxx";
  private platform: string = "android";

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private http: HttpClient) { }

  reloadSetting() {
    this.currency_icon = Helper.getSettingValue("currency_icon");
    this.locale = Helper.getSettingValue("locale");
  }

  setupHeaders(authToken?: string) {
    let tokenToUse = authToken ? authToken : Helper.getToken();
    let savedLanguageCode = Helper.getLanguageDefault();
    this.myHeaders = tokenToUse ? new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': ('Bearer ' + tokenToUse),
      'X-Localization': String(savedLanguageCode ? savedLanguageCode : this.config.availableLanguages[0].code),
      'X-Device-Id': this.uuid ? this.uuid : "xxx",
      'X-Device-Type': this.platform ? this.platform : "android"
    }) : new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Localization': String(savedLanguageCode ? savedLanguageCode : this.config.availableLanguages[0].code),
      'X-Device-Id': this.uuid ? this.uuid : "xxx",
      'X-Device-Type': this.platform ? this.platform : "android"
    });
  }

  setUuidAndPlatform(uuid: string, platform: string) {
    this.uuid = uuid;
    this.platform = platform ? String(platform).toLowerCase() : platform;
    this.setupHeaders();
  }

  public getCountries(): Observable<Array<Country>> {
    return this.http.get<Array<Country>>('./assets/json/countries.json').pipe(
      tap(data => {
        let indiaIndex = -1;
        // if (data) {
        //   for (let i = 0; i < data.length; i++) {
        //     if (data[i].name == "India") {
        //       indiaIndex = i;
        //       break;
        //     }
        //   }
        // }
        if (indiaIndex != -1) data.unshift(data.splice(indiaIndex, 1)[0]);
      }),
      catchError(this.handleError<Array<Country>>('getCountries', []))
    );
  }

  public getContactLink(): Observable<{ link: string }> {
    return this.http.get<{ link: string }>('https://dashboard.vtlabs.dev/whatsapp.php?product_name=foodoz&source=application', { headers: this.myHeaders });
  }
  
  public postNotification(roleTo: string, userIdTo: string): Observable<any> {
    return this.http.post<any>(this.config.apiBase + 'api/user/push-notification', { role: roleTo, user_id: userIdTo }, { headers: this.myHeaders });
  }

  public getURL(url: string): Observable<any> {
    return this.http.get<any>(url, { headers: this.myHeaders });
  }

  public getSettings(): Observable<Array<MyMeta>> {
    return this.http.get<Array<MyMeta>>(this.config.apiBase + 'api/settings', { headers: this.myHeaders });
  }

  public submitSupport(supportRequest: SupportRequest): Observable<{}> {
    return this.http.post<{}>(this.config.apiBase + "api/support", supportRequest, { headers: this.myHeaders });
  }

  public checkUser(checkUserRequest: any): Observable<{}> {
    return this.http.post<{}>(this.config.apiBase + 'api/check-user', checkUserRequest, { headers: this.myHeaders });
  }

  public loginSocial(socialLoginRequest: SocialLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/social/login', socialLoginRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public loginUser(loginTokenRequest: { token: string, role: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/login', loginTokenRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public createUser(signUpRequest: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/register', signUpRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public updateUser(updateRequest): Observable<User> {
    return this.http.put<User>(this.config.apiBase + 'api/user', updateRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public walletTransfer(wtr: PayoutRequest): Observable<any> {
    return this.http.post<any>(this.config.apiBase + 'api/user/wallet/payout', wtr, { headers: this.myHeaders });
  }

  public getInsightEarning(insightRequest: { duration: string; limit: number }): Observable<EarningInsight> {
    let urlParams = new URLSearchParams();
    urlParams.append("duration", insightRequest.duration);
    urlParams.append("limit", String(insightRequest.limit));
    return this.http.get<EarningInsight>(this.config.apiBase + 'api/user/wallet/earnings?' + urlParams.toString(), { headers: this.myHeaders });
  }

  public getInsightOrder(deliveryId, insightRequest: { duration: string; limit: number }): Observable<OrderInsight> {
    let urlParams = new URLSearchParams();
    urlParams.append("duration", insightRequest.duration);
    urlParams.append("limit", String(insightRequest.limit));
    return this.http.get<OrderInsight>(this.config.apiBase + 'api/delivery/' + deliveryId + '/summary?' + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (!data.orders_chart_data) data.orders_chart_data = [{ period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }];
    }));
  }

  public getBalance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(this.config.apiBase + 'api/user/wallet/balance', { headers: this.myHeaders }).pipe(tap(data => {
      if (!data.balance) data.balance = 0;
      data.balance = Number(data.balance.toFixed(2));
    }));
  }

  public getTransactions(): Observable<BaseListResponse> {
    return this.http.get<BaseListResponse>(this.config.apiBase + 'api/user/wallet/transactions', { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data && data.data.length) for (let trans of data.data) this.setupTransaction(trans);
    }));
  }

  public updateOrder(ur, orderId): Observable<Order> {
    this.reloadSetting();
    return this.http.put<Order>(this.config.apiBase + "api/orders/" + orderId, ur, { headers: this.myHeaders }).pipe(tap(data => {
      this.setupOrder(data);
    }));
  }

  public getOrder(profileId): Observable<Order> {
    this.reloadSetting();
    return this.http.get<Order>(this.config.apiBase + "api/delivery/" + profileId + "/order", { headers: this.myHeaders }).pipe(tap(data => {
      this.setupOrder(data);
    }));
  }

  public getOrderById(orderId): Observable<Order> {
    this.reloadSetting();
    return this.http.get<Order>(this.config.apiBase + "api/orders/" + orderId, { headers: this.myHeaders }).pipe(tap(data => {
      this.setupOrder(data);
    }));
  }

  public getOrderRequest(profileId): Observable<OrderRequest> {
    this.reloadSetting();
    return this.http.get<OrderRequest>(this.config.apiBase + "api/delivery/" + profileId + "/request", { headers: this.myHeaders }).pipe(tap(data => {
      data.created_at = Helper.formatTimestampDate(data.created_at, this.locale);
      data.updated_at = Helper.formatTimestampDate(data.updated_at, this.locale);
      this.setupOrder(data.order);
    }));
  }

  public getProfile(): Observable<Profile> {
    return this.http.get<Profile>(this.config.apiBase + "api/delivery", { headers: this.myHeaders }).pipe(tap(data => {
      this.setupProfile(data);
    }));
  }

  public updateOrderRequest(orUr, requestId): Observable<OrderRequest> {
    return this.http.put<OrderRequest>(this.config.apiBase + "api/delivery/request/" + requestId, orUr, { headers: this.myHeaders });
  }

  public updateProfile(profileUpdateRequest, profileId): Observable<Profile> {
    return this.http.put<Profile>(this.config.apiBase + "api/delivery/" + profileId, profileUpdateRequest, { headers: this.myHeaders }).pipe(tap(data => {
      this.setupProfile(data);
    }));
  }

  public getFaqs(): Observable<Array<Faq>> {
    return this.http.get<Array<Faq>>(this.config.apiBase + 'api/faq', { headers: this.myHeaders });
  }

  setupProfile(profile: Profile) {
    if (typeof profile.meta == "string") profile.meta = JSON.parse(profile.meta as string);
    if (profile.meta == null) profile.meta = {};
    if (profile.user) this.setupUserMe(profile.user);
  }

  private setupUserMe(data) {
    if (!data.mediaurls || !data.mediaurls.images) data.mediaurls = { images: [] };
    if (!data.image_url) for (let imgObj of data.mediaurls.images) if (imgObj["default"]) { data.image_url = imgObj["default"]; break; }
  }

  public setupTransaction(transaction: WalletTransaction) {
    transaction.created_at = Helper.formatTimestampDateTime(transaction.created_at, this.locale);
    transaction.updated_at = Helper.formatTimestampDateTime(transaction.updated_at, this.locale);
    if (!transaction.amount) transaction.amount = 0;
    transaction.amount = Number(transaction.amount.toFixed(2));
    if (transaction.meta && transaction.meta.source_amount) transaction.meta.source_amount = Number(Number(transaction.meta.source_amount).toFixed(2));
  }

  public setupOrder(order: Order) {
    order.created_at = Helper.formatTimestampDate(order.created_at, this.locale);
    if (order.scheduled_on) order.scheduled_on = Helper.formatTimestampDate(order.scheduled_on, this.locale);

    order.total_toshow = this.currency_icon + Number(order.total).toFixed(2);
    order.subtotal_toshow = this.currency_icon + Number(order.subtotal).toFixed(2);
    if (order.delivery_fee) order.delivery_fee_toshow = this.currency_icon + Number(order.delivery_fee).toFixed(2);
    if (order.discount) order.discount_toshow = this.currency_icon + Number(order.discount).toFixed(2);
    if (order.taxes) order.taxes_toshow = this.currency_icon + Number(order.taxes).toFixed(2);

    for (let product of order.products) {
      product.total_toshow = this.currency_icon + Number(product.total).toFixed(2);
      if (product.vendor_product && product.vendor_product.product) {
        if (!product.vendor_product.product.price) product.vendor_product.product.price = 0;
        product.vendor_product.product.priceToShow = this.currency_icon + Number(product.vendor_product.product.price).toFixed(2);

        product.vendor_product.product.image_urls = new Array<string>();
        if (product.vendor_product.product.mediaurls && product.vendor_product.product.mediaurls.images) for (let imgObj of product.vendor_product.product.mediaurls.images) if (imgObj["default"]) product.vendor_product.product.image_urls.push(imgObj["default"]);
        if (!product.vendor_product.product.image_urls.length) product.vendor_product.product.image_urls.push("assets/images/plc_item_image.png");

        product.vendor_product.product.prescription_required = (product.vendor_product.product.meta && product.vendor_product.product.meta.prescription);
      }
    }

    if (order.vendor) {
      if (!order.vendor.mediaurls || !order.vendor.mediaurls.images) order.vendor.mediaurls = { images: [] };
      order.vendor.image = "assets/images/plc_item_image.png";
      for (let imgObj of order.vendor.mediaurls.images) if (imgObj["default"]) { order.vendor.image = imgObj["default"]; break; }
    }

    if (order.delivery) {
      order.delivery.delivery.user.image_url = "assets/images/empty_dp";
      if (!order.delivery.delivery.user.mediaurls || !order.delivery.delivery.user.mediaurls.images) order.delivery.delivery.user.mediaurls = { images: [] };
      for (let imgObj of order.delivery.delivery.user.mediaurls.images) if (imgObj["default"]) { order.delivery.delivery.user.image_url = imgObj["default"]; break; }
    }

    if (order.user) {
      if (!order.user.mediaurls || !order.user.mediaurls.images) order.user.mediaurls = { images: [] };
      order.user.image_url = "assets/images/empty_dp.png";
      for (let imgObj of order.user.mediaurls.images) if (imgObj["default"]) { order.user.image_url = imgObj["default"]; break; }
    }
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
