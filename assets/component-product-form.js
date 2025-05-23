if ( typeof ProductVariants !== 'function' ) {

	class ProductVariants extends HTMLElement {

		constructor() {
			super();
			this.init();
		}

		init() {
			this.price = document.querySelector(`#product-price-${this.dataset.id}`);

			if ( this.price ) {
				this.priceOriginal = this.price.querySelector('[data-js-product-price-original]');
				this.priceCompare = this.price.querySelector('[data-js-product-price-compare]');
				this.priceUnit = this.price.querySelector('[data-js-product-price-unit]');
			}

			this.productForm = document.querySelector(`#product-form-${this.dataset.id}`);
			if ( this.productForm ) {
				this.productQty = this.productForm.querySelector('[data-js-product-quantity]');
				this.addToCart = this.productForm.querySelector('[data-js-product-add-to-cart]');
				this.addToCartText = this.productForm.querySelector('[data-js-product-add-to-cart-text]');
			}

			this.addEventListener('change', this.onVariantChange);
			let initVariantChange = false;

			if ( this.hasAttribute('data-variant-required' ) ) {
				this.variantRequired = true;
				this.noVariantSelectedYet = true;
				if ( document.location.search.includes('variant') ) {
					const initVariant = parseInt(new URLSearchParams(document.location.search).get('variant'));
					this.currentVariant = this.getVariantData().find((variant) => {
						if ( variant.id == initVariant ) {
							variant.options.map((option, index) => {
								const variantContainer = this.querySelectorAll(`[data-js-product-variant]`)[index].querySelector(`[data-js-product-variant-container]`);
								if ( variantContainer.dataset.jsProductVariantContainer == 'radio' ) {
									variantContainer.querySelector(`input[value="${option}"]`).checked = true;
								} else if ( variantContainer.dataset.jsProductVariantContainer == 'select' ) {
									variantContainer.value = option;
								}
							})
							return variant;
						}
					});

					if ( this.currentVariant ) {
						this.variantRequired = false;
						this.noVariantSelectedYet = false;
						this.classList.add('variant-selected');
						initVariantChange = true;
					}

				}

			} else {
				this.variantRequired = false;
				this.noVariantSelectedYet = false;
				this.classList.add('variant-selected');
			}

			this.updateOptions();
			this.updateMasterId();
			this.updateUnavailableVariants();

			this.productStock = document.querySelector(`#product-${this.dataset.id} [data-js-variant-quantity]`);
			this.productStockProgress = document.querySelector(`#product-${this.dataset.id} [data-js-variant-quantity-progress]`);
			if ( this.productStock && document.querySelector(`#product-${this.dataset.id} [data-js-variant-quantity-data]`) ) {
				this.productStockData = JSON.parse(document.querySelector(`#product-${this.dataset.id} [data-js-variant-quantity-data]`).dataset.inventory);
			}
			this.updateStock();

			this._event = new Event('VARIANT_CHANGE');

			if ( initVariantChange ) {
				this.onVariantChange();
			}

            this.hideVariantsBasedOnMetafields();
		}

		hideVariantsBasedOnMetafields() {
			const variantData = this.getVariantData();

			// Create a map to store hidden variants by option index and value
			const hiddenVariantsByOption = new Map();

			// Track which complete variants are hidden
			const hiddenCompleteVariants = new Set();

			// First pass - collect all hidden variants and their combinations
			variantData.forEach(variant => {
				if (variant.metafields?.custom?.hide_from_website?.value === true) {
					// Store the complete variant
					hiddenCompleteVariants.add(variant.id);

					// Store each option from hidden variants
					variant.options.forEach((option, index) => {
						if (!hiddenVariantsByOption.has(index)) {
							hiddenVariantsByOption.set(index, new Set());
						}

						// Check if this option value makes ALL variants hidden
						const allVariantsWithOptionHidden = variantData
							.filter(v => v.options[index] === option)
							.every(v => v.metafields?.custom?.hide_from_website?.value === true);

						if (allVariantsWithOptionHidden) {
							hiddenVariantsByOption.get(index).add(option);
						}
					});
				}
			});

			// Process each variant container
			this.querySelectorAll('[data-js-product-variant]').forEach((container, containerIndex) => {
				const variantContainer = container.querySelector('[data-js-product-variant-container]');
				const isSelect = variantContainer.dataset.jsProductVariantContainer === 'select';
				const options = isSelect ?
					variantContainer.querySelectorAll('option') :
					variantContainer.querySelectorAll('.product-variant__item');

				const hiddenOptionsForThisVariant = hiddenVariantsByOption.get(containerIndex) || new Set();

				options.forEach(option => {
					const value = isSelect ? option.value : option.querySelector('input').value;

					// Skip the default "Select" option if it exists
					if (value === '' || value === 'Select') return;

					if (hiddenOptionsForThisVariant.has(value)) {
						// Hide the option
						option.style.display = 'none';

						// Handle default selection
						if (isSelect) {
							if (option.selected) {
								this.selectNextAvailableOption(options, hiddenOptionsForThisVariant);
							}
						} else {
							const input = option.querySelector('input');
							if (input.checked) {
								this.selectNextAvailableRadio(options, hiddenOptionsForThisVariant);
							}
						}
					} else {
						// Show the option
						option.style.display = '';
					}
				});

				// After processing each container, update available combinations
				this.updateAvailableCombinations(containerIndex, hiddenCompleteVariants);
			});

			// Update variant selection after hiding options
			this.updateOptions();
			this.updateMasterId();
			this.updateVariantInput();
		}

		selectNextAvailableOption(options, hiddenOptions) {
			const nextOption = Array.from(options).find(opt =>
				opt.value &&
				opt.value !== 'Select' &&
				!hiddenOptions.has(opt.value)
			);
			if (nextOption) nextOption.selected = true;
		}

		selectNextAvailableRadio(options, hiddenOptions) {
			const nextOption = Array.from(options).find(opt => {
				const input = opt.querySelector('input');
				return !hiddenOptions.has(input.value);
			});
			if (nextOption) nextOption.querySelector('input').checked = true;
		}

		updateAvailableCombinations(currentIndex, hiddenCompleteVariants) {
			const selectedOptions = this.getSelectedOptions();

			// Only proceed if we have selections up to the current index
			if (selectedOptions.length <= currentIndex) return;

			this.querySelectorAll('[data-js-product-variant]').forEach((container, index) => {
				// Only process containers after the current one
				if (index <= currentIndex) return;

				const variantContainer = container.querySelector('[data-js-product-variant-container]');
				const isSelect = variantContainer.dataset.jsProductVariantContainer === 'select';
				const options = isSelect ?
					variantContainer.querySelectorAll('option') :
					variantContainer.querySelectorAll('.product-variant__item');

				options.forEach(option => {
					const value = isSelect ? option.value : option.querySelector('input').value;
					if (!value || value === 'Select') return;

					// Check if this combination would create a hidden variant
					const wouldCreateHiddenVariant = this.variantData.some(variant => {
						const matchesSelectedOptions = selectedOptions.every((selectedValue, i) =>
							variant.options[i] === selectedValue
						);
						const matchesThisOption = variant.options[index] === value;

						return matchesSelectedOptions && matchesThisOption && hiddenCompleteVariants.has(variant.id);
					});

					option.style.display = wouldCreateHiddenVariant ? 'none' : '';
				});
			});
		}

		getSelectedOptions() {
			const selectedOptions = [];
			this.querySelectorAll('[data-js-product-variant-container]').forEach(container => {
				const isSelect = container.dataset.jsProductVariantContainer === 'select';
				if (isSelect) {
					if (container.value && container.value !== 'Select') {
						selectedOptions.push(container.value);
					}
				} else {
					const selectedRadio = container.querySelector('input:checked');
					if (selectedRadio) {
						selectedOptions.push(selectedRadio.value);
					}
				}
			});
			return selectedOptions;
		}

		onVariantChange(){

			this.updateOptions();
			this.updateMasterId();
			this.updateVariantInput();
			if ( this.price ) {
				this.updatePrice();
			}
			this.updateStock();
			this.updateUnavailableVariants();
			this.updatePickupAvailability();
			if ( ! this.hasAttribute('data-no-history') ) {
				this.updateURL();
			}
			this.updateDetails();

			if ( this.productForm ) {
				if ( ! this.currentVariant || ! this.currentVariant.available ) {
					if ( this.productQty ) this.productQty.style.display = 'none';
					this.addToCart.classList.add('disabled');
					this.productForm.classList.add('disabled-cart');
					this.addToCartText.textContent = theme_custom_data.settings.locales.products_sold_out_variant;
				} else {
					if ( this.productQty ) this.productQty.style.display = '';
					this.addToCart.classList.remove('disabled');
					this.productForm.classList.remove('disabled-cart');
					this.addToCartText.textContent = this.hasAttribute('data-show-bundle-wording') ? theme_custom_data.settings.locales.products_add_to_bundle_button : this.addToCartText.hasAttribute('data-show-preorder-wording') ? theme_custom_data.settings.locales.products_preorder_button : theme_custom_data.settings.locales.products_add_to_cart_button;
				}
				if ( ! this.currentVariant ) {
					this.productForm.classList.add('unavailable-variant');
					this.addToCartText.textContent = (this.variantRequired && this.noVariantSelectedYet) ? theme_custom_data.settings.locales.products_variant_required : theme_custom_data.settings.locales.products_unavailable_variant;
				} else {
					this.productForm.classList.remove('unavailable-variant');
				}
			}
			this.dispatchEvent(this._event);

		}

		updateOptions(){

			this.options = [];

			this.querySelectorAll('[data-js-product-variant-container]').forEach(elm=>{
				if ( elm.dataset.jsProductVariantContainer == 'radio' ) {
					elm.querySelectorAll('.product-variant__input').forEach(el=>{
						if ( el.checked ) {
							this.options.push(el.value);
						}
					});
				} else {
					if ( ! ( this.variantRequired && elm.selectedIndex == 0 ) ) {
						this.options.push(elm.value);
					}
				}
			});

			if ( this.variantRequired && this.noVariantSelectedYet && this.options.length >= parseInt(this.dataset.variants) ) {
				this.noVariantSelectedYet = false;
				this.classList.add('variant-selected');
			}

		}

		updateMasterId(){
			this.currentVariant = this.getVariantData().find((variant) => {
				return !variant.options.map((option, index) => {
					return this.options[index] === option;
				}).includes(false);
			});
		}

		updatePrice(){

			if (!this.currentVariant) {
				if ( ! ( this.variantRequired && this.noVariantSelectedYet ) ) {
					this.priceOriginal.innerHTML = '';
					this.priceCompare.innerHTML = '';
					this.priceUnit.innerHTML = '';
				}
			} else {
				this.priceOriginal.innerHTML = this._formatMoney(this.currentVariant.price, theme_custom_data.settings.shop_money_format);
				if ( this.currentVariant.compare_at_price > this.currentVariant.price ) {
					this.priceCompare.innerHTML = this._formatMoney(this.currentVariant.compare_at_price, theme_custom_data.settings.shop_money_format);
				} else {
					this.priceCompare.innerHTML = '';
				}

				if ( this.currentVariant.unit_price_measurement ) {
					this.priceUnit.innerHTML = `
						${this._formatMoney(this.currentVariant.unit_price, theme_custom_data.settings.shop_money_format)} / 
						${( this.currentVariant.unit_price_measurement.reference_value != 1 ? this.currentVariant.unit_price_measurement.reference_value + ' ' : '' )}
						${this.currentVariant.unit_price_measurement.reference_unit}
					`;
				} else {
					this.priceUnit.innerHTML = '';
				}
			}

		}

		updateStock(){

			if (!this.currentVariant) {
				if ( this.productStock ) {
					this.productStock.innerHTML = '';
				}
			} else {
				if ( this.productStock && this.productStockData ) {

					let currentVariant = false;
					for ( const variant of this.productStockData ) {
						if ( variant.id == this.currentVariant.id ) {
							currentVariant = variant;
							break;
						}
					}
					this.productStock.innerHTML = '';

					if ( currentVariant ) {

						if ( currentVariant.quantity <= 0 ) {
							if ( currentVariant.inventory == 'continue' ) {
								this.productStock.innerHTML = theme_custom_data.settings.locales.products_preorder;
								this.productStock.setAttribute('data-stock', 'pre-order');
							} else if ( currentVariant.inventory == 'deny' ) {
								this.productStock.innerHTML = theme_custom_data.settings.locales.products_no_products;
								this.productStock.setAttribute('data-stock', 'out-of-stock');
							}
						} else if ( currentVariant.quantity == '1' ) {
							this.productStock.innerHTML = theme_custom_data.settings.locales.products_one_product;
							this.productStock.setAttribute('data-stock', 'one-item-stock');
						} else if ( currentVariant.quantity <= parseInt(this.productStock.dataset.lowStock) ) {
							this.productStock.innerHTML = theme_custom_data.settings.locales.products_few_products.replace('{{ count }}', currentVariant.quantity);
							this.productStock.setAttribute('data-stock', 'little-stock');
						} else if ( currentVariant.unavailable ) {
							this.productStock.innerHTML = theme_custom_data.settings.locales.products_no_products;
							this.productStock.setAttribute('data-stock', 'out-of-stock');
						} else if ( currentVariant.quantity > parseInt(this.productStock.dataset.lowStock) && this.productStock.dataset.type == "always" ) {
							this.productStock.innerHTML = theme_custom_data.settings.locales.products_many_products.replace('{{ count }}', currentVariant.quantity);
							this.productStock.setAttribute('data-stock', 'in-stock');
						} else if ( ! currentVariant.quantity && this.productStock.dataset.type == "always" )  {
							this.productStock.innerHTML = theme_custom_data.settings.locales.products_enough_products;
							this.productStock.setAttribute('data-stock', 'in-stock');
						}

						if ( this.productStockProgress ) {
							let progressQty = 0;
							if ( currentVariant.quantity <= 0 && currentVariant.inventory == 'continue' || typeof currentVariant.quantity === 'undefined' ) {
								progressQty = parseInt(this.productStock.dataset.highStock);
							} else if ( currentVariant.quantity > 0 ) {
								progressQty = currentVariant.quantity;
							}
							if ( progressQty >= parseInt(this.productStock.dataset.highStock)  ) {
								this.productStockProgress.style.width = `100%`;
							} else {
								this.productStockProgress.style.width = `${100 * progressQty / parseInt(this.productStock.dataset.highStock)}%`;
							}
						}

					}
				}
			}
		}

		updateDetails(){

			document.querySelectorAll(`#product-${this.dataset.id} [data-js-product-sku]`).forEach(elm=>{
				if ( this.currentVariant && this.currentVariant.sku ) {
					elm.innerHTML = theme_custom_data.settings.locales.product_sku + this.currentVariant.sku;
				} else {
					elm.innerHTML = '';
				}
			});

			document.querySelectorAll(`#product-${this.dataset.id} [data-js-product-barcode]`).forEach(elm=>{
				if ( this.currentVariant && this.currentVariant.barcode ) {
					elm.innerHTML = theme_custom_data.settings.locales.product_barcode + this.currentVariant.barcode;
				} else {
					elm.innerHTML = '';
				}
			});

		}

		updatePickupAvailability() {
			const pickUpAvailability = document.querySelector('pickup-availability');
			if (!pickUpAvailability) return;

			if (this.currentVariant && this.currentVariant.available) {
				pickUpAvailability.fetchAvailability(this.currentVariant.id);
			} else {
				pickUpAvailability.removeAttribute('available');
				pickUpAvailability.innerHTML = '';
			}
		}

		updateUnavailableVariants(){

			if ( this.dataset.hideVariants !== 'false' ) {

				if ( this.dataset.variants === '1' ) {

					this.variantData.forEach((variant) => {
						console.log(variant);
						if ( ! variant.available ) {
							const input = this.querySelector(`[data-js-product-variant-container] .product-variant-value[value="${variant.option1}"]`);
							if ( this.dataset.hideVariants === 'disable' ) {
								input.setAttribute('disabled', 'disabled');
							} else {
								input.classList.add('disabled');
							}
						}
					});

				} else {

					if ( this.querySelector(':checked') ) {

						const selectedOptionOneVariants = this.variantData.filter(
							(variant) => this.querySelector(':checked').value === variant.option1
						);

						const inputWrappers = [...this.querySelectorAll('[data-js-product-variant]')];
						inputWrappers.forEach((option, index) => {
							if (index === 0) return;
							const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
							const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
							const availableOptionInputsValue = selectedOptionOneVariants
								.filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
								.map((variantOption) => variantOption[`option${index + 1}`]);
							this.setInputAvailability(optionInputs, availableOptionInputsValue);
						});

					}

				}

			}
		}

		setInputAvailability(listOfOptions, listOfAvailableOptions) {
			listOfOptions.forEach((input) => {
				if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
					if ( this.dataset.hideVariants == 'disable' ) {
						input.removeAttribute('disabled');
					} else {
						input.classList.remove('disabled');
					}
				} else {
					if ( this.dataset.hideVariants == 'disable' ) {
						input.setAttribute('disabled', 'disabled');
					} else {
						input.classList.add('disabled');
					}
				}
			});
		}

		updateURL(){
			if (!this.currentVariant) return;
			window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
		}

		updateVariantInput() {
			if (!this.currentVariant) return;
			const productForms = document.querySelectorAll(`#product-form-${this.dataset.id}, #product-form-installment`);
			productForms.forEach((productForm) => {
				const input = productForm.querySelector('input[name="id"]');
				input.value = this.currentVariant.id;
				input.dispatchEvent(new Event('change', { bubbles: true }));
			});
		}

		getVariantData() {
			this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
			return this.variantData;
		}

		_formatMoney(cents, format) {

			if (typeof cents === 'string') {
				cents = cents.replace('.', '');
			}

			let value = '';
			const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
			const formatString = format || moneyFormat;

			function formatWithDelimiters(number, precision, thousands, decimal) {
				thousands = thousands || ',';
				decimal = decimal || '.';

				if (isNaN(number) || number === null) {
					return 0;
				}

				number = (number / 100.0).toFixed(precision);

				const parts = number.split('.');
				const dollarsAmount = parts[0].replace(
					/(\d)(?=(\d\d\d)+(?!\d))/g,
					'$1' + thousands
				);
				const centsAmount = parts[1] ? decimal + parts[1] : '';

				return dollarsAmount + centsAmount + theme_custom_data.settings.iso_code;
			}

			switch (formatString.match(placeholderRegex)[1]) {
				case 'amount':
					value = formatWithDelimiters(cents, 2);
					break;
				case 'amount_no_decimals':
					value = formatWithDelimiters(cents, 0);
					break;
				case 'amount_with_comma_separator':
					value = formatWithDelimiters(cents, 2, '.', ',');
					break;
				case 'amount_no_decimals_with_comma_separator':
					value = formatWithDelimiters(cents, 0, '.', ',');
					break;
				case 'amount_no_decimals_with_space_separator':
					value = formatWithDelimiters(cents, 0, ' ');
					break;
				case 'amount_with_apostrophe_separator':
					value = formatWithDelimiters(cents, 2, "'");
					break;
			}

			return formatString.replace(placeholderRegex, value);

		}

	}

  if ( typeof customElements.get('product-variants') == 'undefined' ) {
		customElements.define('product-variants', ProductVariants);
	}

}

/* ---
	Product Form
--- */

if ( typeof ProductForm !== 'function' ) {

	class ProductForm extends HTMLElement {
		constructor() {
			super();
			this.init();
		}

		init(){
			this.cartType = this.hasAttribute('data-ajax-cart') ? 'ajax' : 'page';
			if ( ! document.body.classList.contains('template-cart') || this.hasAttribute('data-force-form' ) ) {
				this.form = this.querySelector('form');
				this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
				this.ADD_TO_CART = new Event('add-to-cart');
			}
			if ( document.body.classList.contains('touchevents') ) {
				const submitButton = this.querySelector('[type="submit"]');
				if ( submitButton ) {
					submitButton.addEventListener('touchend', e=>{
						//submitButton.click();
					});
				}
			}
		}

		onSubmitHandler(e) {

			e.preventDefault();

			const submitButton = this.querySelector('[type="submit"]');

			submitButton.classList.add('working');

			const body = this._serializeForm(this.form);
			let alert = '';

			fetch(`${theme_custom_data.settings.routes.cart_add_url}.js`, {
				body,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'X-Requested-With': 'XMLHttpRequest'
				},
				method: 'POST'
			})
				.then(response => response.json())
				.then(response => {
					if ( response.status == 422 ) {
						// wrong stock logic alert
						alert = document.createElement('span');
						alert.className = 'alert alert--error';
						if ( typeof response.description === 'string' ) {
							alert.innerHTML = response.description;
						} else {
							alert.innerHTML = response.message;
						}
						if ( this.cartType == 'page' ) {
							if ( document.getElementById('product-page-form-error-cart-alert') ) {
								document.getElementById('product-page-form-error-cart-alert').remove();
							}
							alert.style.marginTop = '1em';
							alert.style.marginBottom = '0';
							alert.id = 'product-page-form-error-cart-alert';
							this.form.parentElement.append(alert);
							return false;
						}
						return fetch('?section_id=helper-cart');
					} else {
						if ( this.cartType == 'page' ) {
							document.location.href = theme_custom_data.settings.routes.cart_url;
							return false;
						} else {
							return fetch('?section_id=helper-cart');
						}
					}
				})
				.then(response => response.text())
				.then(text => {

					const sectionInnerHTML = new DOMParser().parseFromString(text, 'text/html');
					const cartFormInnerHTML = sectionInnerHTML.getElementById('AjaxCartForm').innerHTML;
					const cartSubtotalInnerHTML = sectionInnerHTML.getElementById('AjaxCartSubtotal').innerHTML;

					if ( document.getElementById('AjaxCartForm') ) {

						const cartItems = document.getElementById('AjaxCartForm');
						cartItems.innerHTML = cartFormInnerHTML;
						cartItems.ajaxifyCartItems();

						if ( alert != '' ) {
							document.getElementById('AjaxCartForm').querySelector('form').prepend(alert);
						}

						document.getElementById('AjaxCartSubtotal').innerHTML = cartSubtotalInnerHTML;

						document.querySelectorAll('[data-header-cart-count]').forEach(elm=>{
							elm.textContent = document.querySelector('#AjaxCartForm [data-cart-count]').textContent;
						});
						document.querySelectorAll('[data-header-cart-total').forEach(elm=>{
							elm.textContent = document.querySelector('#AjaxCartForm [data-cart-total]').textContent;
						});

					}

					this.dispatchEvent(this.ADD_TO_CART);

					// a11y
					if ( document.getElementById('screen-reader-info') ) {
						document.getElementById('screen-reader-info').innerText = `${theme_custom_data.settings.locales.cart_announcement}`;
						setTimeout(()=>{
							document.getElementById('screen-reader-info').innerText = '';
						}, 1000);
					}

				})
				.catch(e => {
					console.log(e);
				})
				.finally(() => {
					submitButton.classList.remove('working');
				});
		}

		_serializeForm(form) {
			let arr = [];
			Array.prototype.slice.call(form.elements).forEach(function(field) {
				if (
					!field.name ||
					field.disabled ||
					['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1
				)
					return;
				if (field.type === 'select-multiple') {
					Array.prototype.slice.call(field.options).forEach(function(option) {
						if (!option.selected) return;
						arr.push(
							encodeURIComponent(field.name) +
								'=' +
								encodeURIComponent(option.value)
						);
					});
					return;
				}
				if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked)
					return;
				arr.push(
					encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value)
				);
			});
			return arr.join('&');
		}

	}

  if ( typeof customElements.get('product-form') == 'undefined' ) {
		customElements.define('product-form', ProductForm);
	}

}

/* ---
	Product Recommendations
--- */

if ( typeof ProductRecommendations !== 'function' ) {
	class ProductRecommendations extends HTMLElement {

		constructor() {

			super();

      const SUCCESS = new Event('product-recommendations-loaded');
      const FAIL = new Event('product-recommendations-error');

      const handleIntersection = (entries, observer) => {

        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);

        fetch(this.dataset.url)
          .then(response => response.text())
          .then(text => {
            const innerHTML = new DOMParser()
                .parseFromString(text, 'text/html')
                .querySelector('product-recommendations');

								if ( innerHTML && innerHTML.querySelectorAll('[data-js-product-item]').length > 0 ) {
              this.innerHTML = innerHTML.innerHTML;
              this.querySelectorAll('form').forEach(elm=>{
                if (elm.querySelector('template')) {
                  elm.append(elm.querySelector('template').content.cloneNode(true));
                }
              });
              this.dispatchEvent(SUCCESS);
            } else {
							this.dispatchEvent(FAIL);
						}
          })
          .catch(e => {
						this.dispatchEvent(FAIL);
          });
      }

			new IntersectionObserver(handleIntersection.bind(this), {rootMargin: `0px 0px 400px 0px`}).observe(this);

		}

	}

  if ( typeof customElements.get('product-recommendations') == 'undefined' ) {
		customElements.define('product-recommendations', ProductRecommendations);
	}

}

/* ---
	Gift card recipent
--- */

if ( typeof GiftCardRecipient !== 'function' ) {

	class GiftCardRecipient extends HTMLElement {

		constructor() {

			super();

			const properties = Array.from(this.querySelectorAll('[name*="properties"]'));
			const checkboxPropertyName = 'properties[__shopify_send_gift_card_to_recipient]';

			this.recipientCheckbox = properties.find(input => input.name === checkboxPropertyName);
			this.recipientOtherProperties = properties.filter(input => input.name !== checkboxPropertyName);
			this.recipientFieldsContainer = this.querySelector('.gift-card-recipient__fields');

			if ( this.recipientCheckbox ) {
				this.recipientCheckbox.addEventListener('change', this.synchronizeProperties.bind(this));
			}
			this.synchronizeProperties();

		}

		synchronizeProperties() {
			this.recipientOtherProperties.forEach(property => property.disabled = !this.recipientCheckbox.checked);
			this.recipientFieldsContainer.classList.toggle('hide', !this.recipientCheckbox.checked);
		}

	}

  if ( typeof customElements.get('gift-card-recipient') == 'undefined' ) {
		customElements.define('gift-card-recipient', GiftCardRecipient);
	}

}

/* ---
	Sticky Add to Cart
--- */

if ( typeof StickyAddToCart !== 'function' ) {
	class StickyAddToCart extends HTMLElement {

		constructor() {

			super();

			const productPage = document.getElementById(this.dataset.id);
			this.hasAttribute('data-append-to') ? document.querySelector(this.dataset.appendTo).appendChild(this) : document.body.appendChild(this);

			const productButton = productPage.querySelector('[data-js-product-add-to-cart]');
			const stickyBar = this;

			function toggleStickyBarOnScroll() {
				const rect = productButton.getBoundingClientRect();
				const isInViewport = (
						rect.top >= 0 &&
						rect.left >= 0 &&
						( rect.bottom - 80 ) <= (window.innerHeight || document.documentElement.clientHeight) &&
						rect.right <= (window.innerWidth || document.documentElement.clientWidth)
				);
				const isMobile = window.innerWidth < 728;

				if ( ( ! isMobile && rect.top < 0 ) || ( isMobile && ! isInViewport ) ) {
					stickyBar.classList.add('visible');
				} else {
					stickyBar.classList.remove('visible');
				}
			}
			window.addEventListener('scroll', toggleStickyBarOnScroll);
			toggleStickyBarOnScroll();

			if ( this.hasAttribute('data-single') ) {

				const stickyButton = this.querySelector('button[data-js-atc]');

				stickyButton.addEventListener('click', ()=>{
					productButton.click();
					stickyButton.classList.add('working');
				});

				new MutationObserver(()=>{
					if ( productButton.classList.contains('working') ) {
						stickyButton.classList.add('working');
					} else {
						stickyButton.classList.remove('working');
					}
				}).observe(productButton, {
					attributes: true, childList: false, subtree: false
				})

			} else {

				this.querySelector('button[data-js-choose]').addEventListener('click', ()=>{
					productButton.scrollIntoView({behavior: "smooth", block: "center"});
				});

			}

		}

	}

  if ( typeof customElements.get('sticky-add-to-cart') == 'undefined' ) {
		customElements.define('sticky-add-to-cart', StickyAddToCart);
	}

}