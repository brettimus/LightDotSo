// Copyright (C) 2023 Light, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

use anyhow::Result;
use autometrics::{autometrics, prometheus_exporter};
use axum::{
    extract::State,
    http::{uri::Uri, Request, Response},
    routing::get,
    Router,
};
use hyper::{client::HttpConnector, header::HeaderValue, Body, HeaderMap};

use lightdotso_bin::version::{LONG_VERSION, SHORT_VERSION};
use lightdotso_tracing::{init, stdout, tracing::Level};

type Client = hyper::client::Client<HttpConnector, Body>;

#[autometrics]
async fn handler(State(client): State<Client>, mut req: Request<Body>) -> Response<Body> {
    let org_slug = "lightdotso";
    let query = req.uri().query().unwrap_or_default();

    let uri = format!("https://api.fly.io/prometheus/{}?{}", org_slug, query);

    *req.uri_mut() = Uri::try_from(uri).unwrap();

    let mut headers = HeaderMap::new();
    let token = std::env::var("FLY_API_TOKEN").unwrap_or_else(|_| panic!("FLY_API_TOKEN not set"));
    headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", token)).unwrap());

    *req.headers_mut() = headers;

    client.request(req).await.unwrap()
}

#[autometrics]
async fn health_check() -> &'static str {
    "OK"
}

pub async fn start_server() -> Result<()> {
    init(vec![stdout(Level::INFO)]);

    let client = Client::new();

    let app = Router::new()
        .route("/", get(handler))
        .with_state(client)
        .route("/health", get(health_check))
        .route("/metrics", get(|| async { prometheus_exporter::encode_http_response() }));

    let socket_addr = "0.0.0.0:3002".parse()?;
    axum::Server::bind(&socket_addr).serve(app.into_make_service()).await?;

    Ok(())
}

#[tokio::main]
pub async fn main() -> Result<(), anyhow::Error> {
    println!("Starting server at {} {}", SHORT_VERSION, LONG_VERSION);
    start_server().await?;
    Ok(())
}