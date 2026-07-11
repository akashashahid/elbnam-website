const API_URL='/api/products';

function cloudinaryEnhance(url){
  if(!url||!url.includes('res.cloudinary.com'))return url;
  return url.replace('/upload/','/upload/e_background_removal/b_white,c_pad,w_800,h_1000,e_improve,e_sharpen,q_auto,f_auto/');
}
let allProducts=[],cart=[],currentProduct=null,selectedSize=null,currentQty=1,activeCategory='all',activeSubcategory='';
let detailImgs=[],detailImgIdx=0;
const cardSelectedSizes={};
const SUBCATEGORIES={mens:['Shirts','Pants','Kurta','Waistcoat','Shalwar Kameez'],kids:['Shirts','Pants','Frocks','Suits','Shalwar Kameez'],festive:['Sherwani','Kurta','Lehenga','Saree','Gharara']};

async function loadProducts(){
  const container=document.getElementById('productsContainer');
  container.innerHTML='<div style="grid-column:1/-1;padding:60px 20px;text-align:center;"><div style="width:36px;height:36px;border:3px solid #f0f0f0;border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div><div style="font-size:13px;color:var(--grey);">Loading products...</div></div>';
  try{
    const res=await fetch(API_URL);
    if(!res.ok)throw new Error('HTTP '+res.status);
    allProducts=await res.json();
    if(!Array.isArray(allProducts))throw new Error('Bad response');
    document.getElementById('productCount').textContent=allProducts.length;
    renderProducts(allProducts);
    renderCategoryFilter();
  }catch(err){
    container.innerHTML='<div style="grid-column:1/-1;padding:60px 20px;text-align:center;"><div style="font-size:13px;color:var(--grey);margin-bottom:16px;">Could not load products. Please check your connection.</div><button onclick="loadProducts()" style="padding:10px 24px;background:var(--gold);color:#fff;border:none;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;">Try Again</button></div>';
  }
}

function renderCategoryFilter(){
  const cats=['all','mens','kids','festive'];
  document.getElementById('categoryFilter').innerHTML=cats.map(c=>`<button class="filter-btn ${c==='all'?'active':''}" onclick="filterByCategory('${c}',this)">${c==='all'?'All Products':c.charAt(0).toUpperCase()+c.slice(1)}</button>`).join('');
}

function filterByCategory(cat,btn){
  activeCategory=cat;activeSubcategory='';
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const sub=document.getElementById('subcategoryFilter');
  if(cat!=='all'&&SUBCATEGORIES[cat]){
    sub.style.display='flex';
    sub.innerHTML=`<button class="sub-btn active" onclick="filterBySubcategory('',this)">All ${cat.charAt(0).toUpperCase()+cat.slice(1)}</button>`+SUBCATEGORIES[cat].map(s=>`<button class="sub-btn" onclick="filterBySubcategory('${s}',this)">${s}</button>`).join('');
  }else{sub.style.display='none';sub.innerHTML='';}
  applyFilter();
}

function filterBySubcategory(sub,btn){
  activeSubcategory=sub;
  document.querySelectorAll('.sub-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter();
}

function applyFilter(){
  let f=allProducts;
  if(activeCategory!=='all')f=f.filter(p=>p.category===activeCategory);
  if(activeSubcategory)f=f.filter(p=>p.subcategory===activeSubcategory);
  renderProducts(f);
}

function renderProducts(products){
  var c=document.getElementById('productsContainer');
  if(!products.length){c.innerHTML='<div class="loading">No products found</div>';return;}
  c.innerHTML=products.map(function(p){
    var oos=!p.inStock;
    var id=p._id;
    var stockMap=p.sizeStock||{};
    var rawImg=(p.images&&p.images.length)?p.images[0]:(p.image||'');
    var clickFn=oos?'':"openDetailPage('"+id+"')";
    var sizeBtns='';
    if(p.sizes&&p.sizes.length){
      sizeBtns=p.sizes.map(function(s){
        var qty=stockMap[s]!=null?stockMap[s]:null;
        var sOos=qty!==null&&qty===0;
        var isSel=(cardSelectedSizes[id]===s);
        var dis=(sOos||oos)?'disabled':'';
        var btnCls='card-size-btn'+(isSel?' sel':'');
        return '<button class="'+btnCls+'" '+dis+' onclick="selectCardSize(\''+id+'\',\''+s+'\',this)">'+s+'</button>';
      }).join('');
    }
    var label='';
    if(p.label&&!oos) label='<div class="product-label '+p.label.toLowerCase()+'">'+p.label+'</div>';
    var oosOverlay='';
    if(oos) oosOverlay='<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:2;"><span style="background:#e53935;color:#fff;font-size:9px;letter-spacing:2px;padding:5px 14px;text-transform:uppercase;">Out of Stock</span></div>';
    var price='PKR '+p.price.toLocaleString();
    if(p.originalPrice) price+=' <del>PKR '+p.originalPrice.toLocaleString()+'</del>';
    var sizeRow=sizeBtns?'<div class="card-size-row">'+sizeBtns+'</div>':'';
    var atcOnclick=oos?'':"cardAddToCart('"+id+"')";
    var atcText=oos?'Out of Stock':'Add to Cart';
    var atcDis=oos?'disabled':'';
    return '<div class="product-card" style="'+(oos?'opacity:0.85;':'')+'">'
      +'<div class="product-img" onclick="'+clickFn+'" style="cursor:'+(oos?'default':'pointer')+';">'
      +label+oosOverlay
      +'<img src="'+cloudinaryEnhance(rawImg)+'" alt="'+p.name+'" onclick="'+clickFn+'" onerror="this.onerror=null;this.src=\''+rawImg+'\'">'
      +'</div>'
      +'<div class="product-info">'
      +'<div class="product-cat">'+p.category+'</div>'
      +'<div class="product-name" onclick="'+clickFn+'">'+p.name+'</div>'
      +'<div class="product-price">'+price+'</div>'
      +sizeRow
      +'<div class="product-line"></div>'
      +'<button class="card-atc-btn" '+atcDis+' onclick="'+atcOnclick+'">'+atcText+'</button>'
      +'</div>'
      +'</div>';
  }).join('');
}

function selectCardSize(id,size,btn){
  cardSelectedSizes[id]=size;
  const card=btn.closest('.product-card');
  card.querySelectorAll('.card-size-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
}

function cardAddToCart(id){
  const p=allProducts.find(x=>x._id===id);
  if(!p)return;
  const size=cardSelectedSizes[id];
  if(!size){alert('Please select a size first.');return;}
  const stockMap=p.sizeStock||{};
  const available=stockMap[size]!=null?stockMap[size]:999;
  const ex=cart.find(i=>i._id===id&&i.size===size);
  const inCart=ex?ex.qty:0;
  if(inCart+1>available){alert('No more stock available for this size.');return;}
  const img=p.images&&p.images.length?cloudinaryEnhance(p.images[0]):(cloudinaryEnhance(p.image)||'');
  if(ex)ex.qty++;
  else cart.push({_id:id,name:p.name,cat:p.category,priceNum:p.price,size,qty:1,image:img});
  updateCartCount();
  showCartToast();
}

function showCartToast(){
  const t=document.getElementById('cartToast');
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>t.classList.remove('show'),2000);
}

/* ---- Detail page ---- */
function openDetailPage(id){
  currentProduct=allProducts.find(p=>p._id===id);
  if(!currentProduct)return;
  selectedSize=null;currentQty=1;
  detailImgs=currentProduct.images&&currentProduct.images.length?currentProduct.images:(currentProduct.image?[currentProduct.image]:[]);
  detailImgIdx=0;
  var _dm=document.getElementById('detailMainImg');
  _dm.onerror=function(){_dm.onerror=null;_dm.src=detailImgs[0]||'';};
  _dm.src=cloudinaryEnhance(detailImgs[0]||'');
  _dm.alt=currentProduct.name;
  const prevBtn=document.getElementById('detailPrevBtn'),nextBtn=document.getElementById('detailNextBtn');
  if(detailImgs.length>1){prevBtn.style.display='flex';nextBtn.style.display='flex';}
  else{prevBtn.style.display='none';nextBtn.style.display='none';}
  const thumbsEl=document.getElementById('detailThumbs');
  if(detailImgs.length>1){
    thumbsEl.style.display='flex';
    thumbsEl.innerHTML=detailImgs.map((url,i)=>`<div class="detail-thumb ${i===0?'active':''}" onclick="setDetailImg(${i})"><img src="${url}" alt=""></div>`).join('');
  }else{thumbsEl.innerHTML='';thumbsEl.style.display='none';}
  document.getElementById('detailCat').textContent=currentProduct.category.toUpperCase()+(currentProduct.subcategory?' · '+currentProduct.subcategory.toUpperCase():'');
  document.getElementById('detailName').textContent=currentProduct.name;
  document.getElementById('detailPrice').innerHTML='PKR '+currentProduct.price.toLocaleString()+(currentProduct.originalPrice?'<del>PKR '+currentProduct.originalPrice.toLocaleString()+'</del>':'');
  document.getElementById('detailQtyNum').textContent='1';
  const sw=document.getElementById('detailSizeWrap');
  sw.innerHTML='';
  const stockMap=currentProduct.sizeStock||{};
  const allOos=currentProduct.sizes.length>0&&currentProduct.sizes.every(s=>(stockMap[s]!=null?stockMap[s]:1)===0);
  currentProduct.sizes.forEach(function(size){
    const qty=stockMap[size]!=null?stockMap[size]:null;
    const sOos=qty!==null&&qty===0;
    const btn=document.createElement('button');
    btn.className='size-btn';btn.textContent=size;btn.disabled=sOos;
    if(sOos)btn.style.cssText='opacity:0.35;cursor:not-allowed;text-decoration:line-through;';
    btn.onclick=function(){
      if(sOos)return;
      document.querySelectorAll('#detailSizeWrap .size-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');selectedSize=size;currentQty=1;
      document.getElementById('detailQtyNum').textContent='1';
    };
    sw.appendChild(btn);
  });
  const addBtn=document.getElementById('detailAddCartBtn');
  addBtn.disabled=allOos;addBtn.style.background=allOos?'#ccc':'';
  addBtn.style.cursor=allOos?'not-allowed':'';addBtn.textContent=allOos?'Out of Stock':'Add to Cart';
  document.getElementById('detailPage').classList.add('open');
  document.body.style.overflow='hidden';
  updateCartCount();
}

function closeDetailPage(){
  document.getElementById('detailPage').classList.remove('open');
  document.body.style.overflow='';
}

function setDetailImg(idx){
  detailImgIdx=idx;
  var m=document.getElementById('detailMainImg');
  m.onerror=function(){m.onerror=null;m.src=detailImgs[idx];};
  m.src=cloudinaryEnhance(detailImgs[idx]);
  document.querySelectorAll('.detail-thumb').forEach((t,i)=>t.classList.toggle('active',i===idx));
}

function prevDetailImg(){
  setDetailImg((detailImgIdx-1+detailImgs.length)%detailImgs.length);
}

function nextDetailImg(){
  setDetailImg((detailImgIdx+1)%detailImgs.length);
}

function setMainImage(url,el){
  document.getElementById('detailMainImg').src=url;
  const idx=detailImgs.indexOf(url);
  if(idx>=0)detailImgIdx=idx;
  document.querySelectorAll('.detail-thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}

function detailChangeQty(d){
  const stockMap=currentProduct&&currentProduct.sizeStock?currentProduct.sizeStock:{};
  const maxStock=selectedSize&&stockMap[selectedSize]!=null?stockMap[selectedSize]:999;
  currentQty=Math.min(maxStock||1,Math.max(1,currentQty+d));
  document.getElementById('detailQtyNum').textContent=currentQty;
}

function detailAddToCart(){
  if(!selectedSize){alert('Please select a size first.');return;}
  const stockMap=currentProduct.sizeStock||{};
  const available=stockMap[selectedSize]!=null?stockMap[selectedSize]:999;
  const ex=cart.find(i=>i._id===currentProduct._id&&i.size===selectedSize);
  const inCart=ex?ex.qty:0;
  if(inCart+currentQty>available){alert('You\'ve reached the maximum available stock for this size.');return;}
  const img=currentProduct.images&&currentProduct.images.length?currentProduct.images[0]:(currentProduct.image||'');
  if(ex)ex.qty+=currentQty;
  else cart.push({_id:currentProduct._id,name:currentProduct.name,cat:currentProduct.category,priceNum:currentProduct.price,size:selectedSize,qty:currentQty,image:img});
  updateCartCount();
  showCartToast();
}

function detailOrderWhatsApp(){
  if(!selectedSize){alert('Please select a size first.');return;}
  const msg=`🛔 *Elbnam — Quick Order*\n\n👗 *Product:* ${currentProduct.name}\n📦 *Category:* ${currentProduct.category}\n💰 *Price:* PKR ${currentProduct.price.toLocaleString()}\n📏 *Size:* ${selectedSize}\n🔢 *Quantity:* ${currentQty}\n\n_Sent via Elbnam Website_`;
  closeDetailPage();
  window.open(`https://wa.me/923104508143?text=${encodeURIComponent(msg)}`,'_blank');
}

function updateCartCount(){
  const count=cart.reduce((s,i)=>s+i.qty,0);
  document.querySelectorAll('.cart-count-badge').forEach(el=>el.textContent=count);
}

function openCart(){
  renderCart();
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeCart(){
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
  document.body.style.overflow='';
}

function renderCart(){
  const c=document.getElementById('cartItems'),f=document.getElementById('cartFooter');
  if(!cart.length){c.innerHTML='<div class="cart-empty">🛒<br><br>Your cart is empty</div>';f.style.display='none';return;}
  f.style.display='block';
  let total=0;
  c.innerHTML=cart.map((item,i)=>{
    total+=item.priceNum*item.qty;
    const imgHtml=item.image?`<img src="${cloudinaryEnhance(item.image)}" alt="${item.name}">`:'<div style="width:100%;height:100%;background:var(--grey-ultra);display:flex;align-items:center;justify-content:center;font-size:24px;">👗</div>';
    return`<div class="cart-card">
      <div class="cart-card-img">${imgHtml}</div>
      <div class="cart-card-body">
        <div class="cart-card-name">${item.name}</div>
        <div class="cart-card-meta">${item.cat} · Size: ${item.size}</div>
        <div class="cart-card-price">PKR ${(item.priceNum*item.qty).toLocaleString()}</div>
        <div class="cart-card-actions">
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn" onclick="updateCartQty(${i},-1)">−</button>
            <span class="cart-qty-num">${item.qty}</span>
            <button class="cart-qty-btn" onclick="updateCartQty(${i},1)">+</button>
          </div>
          <button class="cart-item-remove" onclick="removeItem(${i})">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('cartTotal').textContent=`PKR ${total.toLocaleString()}`;
}

function updateCartQty(i,d){
  const item=cart[i];if(!item)return;
  const product=allProducts.find(p=>p._id===item._id);
  const stockMap=product&&product.sizeStock?product.sizeStock:{};
  const maxStock=stockMap[item.size]!=null?stockMap[item.size]:999;
  item.qty=Math.min(maxStock||1,Math.max(1,item.qty+d));
  updateCartCount();renderCart();
}

function removeItem(i){cart.splice(i,1);updateCartCount();renderCart();}

function openCheckoutPage(){
  renderCheckoutItems();
  closeCart();
  document.getElementById('checkoutPage').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeCheckout(){
  document.getElementById('checkoutPage').classList.remove('open');
  document.body.style.overflow='';
}

function renderCheckoutItems(){
  let total=0;
  const html=cart.map((item,i)=>{
    total+=item.priceNum*item.qty;
    const imgHtml=item.image?`<img src="${cloudinaryEnhance(item.image)}" alt="${item.name}">`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;">👗</div>';
    return`<div class="co-card">
      <div class="co-card-img">${imgHtml}</div>
      <div class="co-card-body">
        <div class="co-card-name">${item.name}</div>
        <div class="co-card-meta">${item.cat} · Size: ${item.size}</div>
        <div class="co-card-price">PKR ${(item.priceNum*item.qty).toLocaleString()}</div>
        <div class="co-card-qty">
          <button class="co-qty-btn" onclick="updateCheckoutQty(${i},-1)">−</button>
          <span class="co-qty-num">${item.qty}</span>
          <button class="co-qty-btn" onclick="updateCheckoutQty(${i},1)">+</button>
        </div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('checkoutItems').innerHTML=html;
  document.getElementById('checkoutTotal').textContent=`PKR ${total.toLocaleString()}`;
}

function updateCheckoutQty(i,d){
  const item=cart[i];if(!item)return;
  const product=allProducts.find(p=>p._id===item._id);
  const stockMap=product&&product.sizeStock?product.sizeStock:{};
  const maxStock=stockMap[item.size]!=null?stockMap[item.size]:999;
  item.qty=Math.min(maxStock||1,Math.max(1,item.qty+d));
  updateCartCount();renderCheckoutItems();
}

async function placeOrder(){
  const name=document.getElementById('coName').value.trim();
  const phone=document.getElementById('coPhone').value.trim();
  const address=document.getElementById('coAddress').value.trim();
  const email=document.getElementById('coEmail').value.trim();
  if(!name||!phone||!address){alert('Please fill in your name, phone, and address.');return;}
  const btn=document.getElementById('placeOrderBtn');
  btn.textContent='Placing Order…';btn.disabled=true;
  const orderData={customerName:name,phone,address,email,
    items:cart.map(i=>({productId:i._id,name:i.name,category:i.cat,size:i.size,qty:i.qty,price:i.priceNum})),
    total:cart.reduce((s,i)=>s+i.priceNum*i.qty,0),payment:'COD',status:'Pending',date:new Date().toISOString()};
  try{
    const res=await fetch('/api/orders',
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(orderData)});
    const json=await res.json();
    if(!json.success){
      alert('Sorry, some items in your cart are no longer available in the selected quantity. Please review your cart and try again.');
      btn.textContent='Place Order';btn.disabled=false;return;
    }
  }catch(e){
    alert('Connection error. Please check your internet and try again.');
    btn.textContent='Place Order';btn.disabled=false;return;
  }
  closeCheckout();cart=[];updateCartCount();
  document.getElementById('orderSuccess').style.display='flex';
}

function checkoutWhatsApp(){
  if(!cart.length)return;
  let msg=`🛔 *Elbnam — Cart Order*\n\n`,total=0;
  cart.forEach((item,i)=>{
    msg+=`*${i+1}. ${item.name}*\n   Size: ${item.size} · Qty: ${item.qty}\n   Price: PKR ${(item.priceNum*item.qty).toLocaleString()}\n\n`;
    total+=item.priceNum*item.qty;
  });
  msg+=`*Total: PKR ${total.toLocaleString()}*\n\n_Sent via Elbnam Website_`;
  closeCart();
  window.open(`https://wa.me/923104508143?text=${encodeURIComponent(msg)}`,'_blank');
}

function scrollToProducts(){document.querySelector('.category-filter').scrollIntoView({behavior:'smooth'});}

loadProducts();