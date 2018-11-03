import * as cheerio from "cheerio";
import { get, zip } from "lodash";
import fetch from "make-fetch-happen";
import { join } from "path";

const makeHref = (url: string) => (id: string) =>
  `${url}#${id}`.replace(/#+/, "#");

const cachedFetch = fetch.defaults({
  cacheManager: join(__dirname, ".fetch-cache"),
});

function anchorToProperty(el: Cheerio, url: string, isRequired = false) {
  return {
    href: makeHref(url)(el.attr("href")),
    isRequired,
  };
}

function rowToAriaRole(row: CheerioElement, $: CheerioStatic, url: string) {
  const $row = $(row);

  const roleEl = $row.find("td:nth-child(1)");
  const name = roleEl.text();
  const href = roleEl.find("a").attr("href");

  const description = $row.find("td:nth-child(2)").text();
  const requiredProperties = $row
    .find("td:nth-child(3) a")
    .toArray()
    .map(el => anchorToProperty($(el), url, true));

  const supportedProperties = $row
    .find("td:nth-child(4) a")
    .toArray()
    .map(el => anchorToProperty($(el), url));

  const kindOfContent = $row
    .find("td:nth-child(5)")
    .text()
    .trim();
  const descendantRestrictions = $row
    .find("td:nth-child(6)")
    .text()
    .trim();

  return {
    descendantRestrictions,
    description,
    href,
    kindOfContent,
    name,
    properties: requiredProperties.concat(supportedProperties),
  };
}

async function extractPropertyData(url: string) {
  const html = await cachedFetch(url).then(res => res.text());
  const $ = cheerio.load(html);
  const toHref = makeHref(url);

  const dlChildren = $.root()
    .find("#propcharacteristic_value dl > *")
    .toArray();

  const paired = zip(
    dlChildren.filter(el => el.tagName === "dt"),
    dlChildren.filter(el => el.tagName === "dd"),
  );

  const valueTypes = paired.map(([dt, dd]) => ({
    description: $(dd!).text(),
    href: toHref($(dt!).attr("id")),
    name: $(dt!).text(),
  }));

  const propSections = $.root()
    .find("#state_prop_def > section")
    .toArray();
  const propertiesAndStates = propSections.map(sec => {
    const $sec = $(sec);

    const makeSelector = (sel: string) =>
      [".state-", ".property-"].map(val => val + sel).join(", ");

    const $name = $sec.find(makeSelector("name"));

    return {
      applicableRoles: $sec
        .find(makeSelector("applicability ul li a"))
        .toArray()
        .map(role => $(role).attr("href"))
        .map(toHref),
      description: $sec.find(makeSelector("description")).html(),
      href: toHref($sec.attr("id")),
      inheritedIntoRoles: $sec
        .find(makeSelector("descendants ul li a"))
        .toArray()
        .map(role => $(role).attr("href"))
        .map(toHref),
      name: $name.find("code").text(),
      type: get(
        $name
          .find(".type-indicator")
          .text()
          .trim()
          .match(/\((.*)\)/),
        1,
        undefined,
      ),
      value: {
        descriptions: $sec.find(".value-descriptions tbody tr").map(row => {
          const [value, isDefault] = $(row)
            .find("th")
            .text()
            .trim()
            .split(" (default)");
          return {
            description: $(row)
              .find("td")
              .text()
              .trim(),
            isDefault: isDefault !== undefined,
            value,
          };
        }),
        type: toHref($sec.find(makeSelector("value a")).attr("href")),
      },
    };
  });

  return { valueTypes, propertiesAndStates };
}

async function extractRoleData(url: string) {
  const html = await cachedFetch(url).then(res => res.text());
  const $ = cheerio.load(html);
  return {
    roles: $.root()
      .find("table#aria-table tbody tr")
      .toArray()
      .map(row => rowToAriaRole(row, $, url)),
  };
}

export async function crawl() {
  const roleData = await extractRoleData("https://www.w3.org/TR/html-aria/");
  const ariaData = await extractPropertyData(
    "https://www.w3.org/TR/wai-aria-1.1/",
  );

  return { ...roleData, ...ariaData };
}

export type IAriaCrawl = Promised<ReturnType<typeof crawl>>;
export type IPropertyOrState = IAriaCrawl["propertiesAndStates"][0];
export type IRole = IAriaCrawl["roles"][0];
export type IValueType = IAriaCrawl["valueTypes"][0];
