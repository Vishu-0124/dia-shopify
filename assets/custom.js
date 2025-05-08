/*-----------------------------------------------------------------------------/
/ Custom Theme JS
/-----------------------------------------------------------------------------*/

// Insert any custom theme js here...

const $bestSellerSliders = $('.best-sellers__slider');

if ($bestSellerSliders.length) {
    $bestSellerSliders.each(function () {
        $(this).slick({
            slidesToShow: 4,
            slidesToScroll: 4,
            infinite: false,
            dots: true,
            arrows: false,
            responsive: [
                {
                    breakpoint: 767,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2
                    }
                },
            ]
        });
    });
}


window.addEventListener('DOMContentLoaded', () => {
    // FAQ
    let faqItems = document.querySelectorAll('.faq__item');

    if (faqItems.length) {
        faqItems.forEach((item) => {
            let contentELem = item.querySelector('.faq__item-content');
            let btn = item.querySelector('.faq__item-btn');

            btn.addEventListener('click', () => {
                if (!btn.classList.contains('opened')) {
                    btn.classList.add('opened');
                    let height = contentELem.scrollHeight;
                    contentELem.style.height = `${height}px`;
                } else {
                    btn.classList.remove('opened');
                    contentELem.style.height = '0px';
                }
            })
        })
    }
})

// FOOTER DROPDOWNS
const footerDropDownBtns = document.querySelectorAll('.footer__main-navigation .footer__main-tille');

if (footerDropDownBtns.length) {
    footerDropDownBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            let content = btn.parentNode.querySelector('.footer__main-links');

            if (content) {
                content.classList.toggle('open');
            }
        })
    });
}


const headerMenus = document.querySelectorAll('.js-header-sub-link');

if (headerMenus) {
    headerMenus.forEach(menu => {
        menu.addEventListener('click', () => {
            menu.classList.add('js-active');
        })
    })
}