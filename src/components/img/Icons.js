import React from "react"

export function IconSoccer(props) {
    return (
        <svg
            className="intro-icons"
            viewBox="0 0 24 24"
            height="1em"
            width="1em"
            {...props}
        >
            <path d="M16.93 17.12l-.8-1.36 1.46-4.37 1.41-.47 1 .75v.14c0 .07.03.13.03.19 0 1.97-.66 3.71-1.97 5.21l-1.13-.09M9.75 15l-1.37-4.03L12 8.43l3.62 2.54L14.25 15h-4.5M12 20.03c-.88 0-1.71-.14-2.5-.42l-.69-1.51.66-1.1h5.11l.61 1.1-.69 1.51c-.79.28-1.62.42-2.5.42m-6.06-2.82c-.53-.62-.99-1.45-1.38-2.46-.39-1.02-.59-1.94-.59-2.75 0-.06.03-.12.03-.19v-.14l1-.75 1.41.47 1.46 4.37-.8 1.36-1.13.09M11 5.29v1.4L7 9.46l-1.34-.42-.42-1.36C5.68 7 6.33 6.32 7.19 5.66s1.68-1.09 2.46-1.31l1.35.94m3.35-.94c.78.22 1.6.65 2.46 1.31.86.66 1.51 1.34 1.95 2.02l-.42 1.36-1.34.43-4-2.77V5.29l1.35-.94m-9.42.58C3 6.89 2 9.25 2 12s1 5.11 2.93 7.07S9.25 22 12 22s5.11-1 7.07-2.93S22 14.75 22 12s-1-5.11-2.93-7.07S14.75 2 12 2 6.89 3 4.93 4.93z" />
        </svg>
    );
}

export function IconTv() {
    return (
        <svg
            className="intro-icons-iconTv"
            fill="white"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
        >
            <path d="M4 7 H20 A2 2 0 0 1 22 9 V20 A2 2 0 0 1 20 22 H4 A2 2 0 0 1 2 20 V9 A2 2 0 0 1 4 7 z" />
            <path d="M17 2l-5 5-5-5" />
        </svg>
    );
}

export function IconVote() {
    return (
        <svg
            className="intro-icons"
            viewBox="0 0 24 24"

        >
            <path d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4a2 2 0 002 2h14a2 2 0 002-2v-4l-3-3m-1-5.05l-4.95 4.95L8.5 9.36l4.96-4.95L17 7.95m-4.24-5.66L6.39 8.66a.996.996 0 000 1.41L11.34 15c.39.41 1.02.41 1.41 0l6.36-6.34a.996.996 0 000-1.41L14.16 2.3a.975.975 0 00-1.4-.01z" />
        </svg>
    );
}
export function IconSearch() {
    return (
        <svg className="nav-search-icon" viewBox="0 0 24 24" >
            <path

                fillRule="evenodd"
                d="M18.319 14.433A8.001 8.001 0 006.343 3.868a8 8 0 0010.564 11.976l.043.045 4.242 4.243a1 1 0 101.415-1.415l-4.243-4.242a1.116 1.116 0 00-.045-.042zm-2.076-9.15a6 6 0 11-8.485 8.485 6 6 0 018.485-8.485z"
                clipRule="evenodd"
            />
        </svg>
    );
}

export function IconLoading() {
    return (
        <svg className="goal-searching-icon" version="1.1" id="L4" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
            viewBox="0 0 100 100" enable-background="new 0 0 0 0"  >
            <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
                <animateTransform
                    attributeName="transform"
                    dur="1s"
                    type="translate"
                    values="0 15 ; 0 -15; 0 15"
                    repeatCount="indefinite"
                    begin="0.1" />
            </circle>
            <circle fill="#fff" stroke="none" cx="30" cy="50" r="6">
                <animateTransform
                    attributeName="transform"
                    dur="1s"
                    type="translate"
                    values="0 10 ; 0 -10; 0 10"
                    repeatCount="indefinite"
                    begin="0.3" />
            </circle>
            <circle fill="#fff" stroke="none" cx="54" cy="50" r="6">
                <animateTransform
                    attributeName="transform"
                    dur="1s"
                    type="translate"
                    values="0 5 ; 0 -5; 0 5"
                    repeatCount="indefinite"
                    begin="0.6" />
            </circle>
        </svg>


    );
}

export function IconArrowBack() {
    return (
        <svg
            className="ranking-nav-arrowback"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            viewBox="0 0 24 24"

        >
            <path stroke="none" d="M0 0h24v24H0z" />
            <path d="M9 11l-4 4 4 4m-4-4h11a4 4 0 000-8h-1" />
        </svg>
    );
}