"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbInnerProps = {
    title: ReactNode;
    section?: string;
};

export default function BreadcrumbInner({
    title,
    section = "Pages",
}: BreadcrumbInnerProps) {
    return (
        <div
            className="rbt-breadcrumb-default bg-image rbt-breadcrumb-bg-1"
        >
            <div className="container">
                <div className="row ptb--92 ptb_md--40 ptb_sm--40 position-relative">
                    <div className="col-lg-12">
                        <div className="rbt-breadcrumb-inner text-center">
                            <h1 className="rbt-breadcrumb-title h1">
                                {title}
                            </h1>
                            <ul className="rbt-breadcrumb-page-list">
                                <li className="rbt-breadcrumb-item">
                                    <Link href="/marketplace">Home</Link>
                                </li>
                                <li>
                                    <div className="icon-right">
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </div>
                                </li>
                                <li className="rbt-breadcrumb-item">
                                    <a href="#">{section}</a>
                                </li>
                                <li>
                                    <div className="icon-right">
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </div>
                                </li>
                                <li className="rbt-breadcrumb-item active">{title}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="rbt-breadcrumb-bg-elements">
                        <div className="rbt-breadcrumb-bg-element-1 rbt-scroll-trigger fade_in animation-order-2">
                            <Image
                                src="/assets/images/breadcrumb-bg/bg-element-01.webp"
                                alt="Breadcrumb BG"
                                width={220}
                                height={172}
                            />
                        </div>
                        <div className="rbt-breadcrumb-bg-element-2 rbt-scroll-trigger fade_in animation-order-3">
                            <Image
                                src="/assets/images/breadcrumb-bg/bg-element-02.webp"
                                alt="Breadcrumb BG"
                                width={132}
                                height={102}
                            />
                        </div>
                        <div className="rbt-breadcrumb-bg-element-3 rbt-scroll-trigger fade_in animation-order-4">
                            <Image
                                src="/assets/images/breadcrumb-bg/bg-element-03.webp"
                                alt="Breadcrumb BG"
                                width={303}
                                height={226}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
