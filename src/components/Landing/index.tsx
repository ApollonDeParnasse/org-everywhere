import React from "react";

import * as classes from "./vendor_css/template.scss";

document.body.className = classes.body;

import "./stylesheet.css";

import { ArrowRight } from "react-feather";

export default () => {
  return (
    <>
      <nav className="navbar navbar-marketing navbar-expand-lg bg-transparent navbar-dark fixed-top navbar-scrolled">
        <div className="container px-5">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          ></button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <a
              className="btn fw-500 ms-lg-4 btn-teal"
              href="/org-everywhere/sign_in"
            >
              Sign in
              {/* <i className="ms-2" data-feather="arrow-right"></i> */}
              <ArrowRight className="ms-2" />
            </a>
          </div>
        </div>
      </nav>

      <div className="row gx-5 align-items-center">
        <div className="col-lg-6" data-aos="fade-up">
          <h1 className="page-header-ui-title">
            organice is the best way to get stuff done
          </h1>
          <p>
            Whether you're planning multiple work projects, sharing a shopping
            list with your partner or you're planing a holiday, organice is here
            to help you complete all your personal and professional tasks.
          </p>
          <p>
            organice is Free and Open Source software that works on top of Org
            mode files.
          </p>

          <a className="btn btn-teal fw-500 me-2" href="/org-everywhere/sample">
            Live demo
            {/* <i className="ms-2" data-feather="arrow-right"></i> */}
            <ArrowRight className="ms-2" />
          </a>

          <a
            className="btn btn-white fw-500 me-2"
            href="/org-everywhere/sign_in"
          >
            Sign in
            {/* <i className="ms-2" data-feather="arrow-right"></i> */}
            <ArrowRight className="ms-2" />
          </a>
        </div>
      </div>
    </>
  );
};
