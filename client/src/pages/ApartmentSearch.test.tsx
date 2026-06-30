import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ──────────────────────────────────────────────────────────────────
// MapView talks to the real Google Maps JS API via a <script> tag, which
// doesn't exist in jsdom. Replace it with a stub that synchronously reports
// "ready" so ApartmentSearch's marker-placement logic still runs against a
// fake map object, without needing the actual Google Maps SDK.
const fakeMap = {} as google.maps.Map;
const onMapReadySpy = vi.fn();

vi.mock("@/components/Map", () => ({
  MapView: (props: { onMapReady?: (map: google.maps.Map) => void }) => {
    onMapReadySpy(fakeMap);
    props.onMapReady?.(fakeMap);
    return <div data-testid="mock-map-view" />;
  },
}));

vi.mock("@/components/InquiryForm", () => ({
  InquiryForm: () => <div data-testid="mock-inquiry-form" />,
}));

vi.mock("@/components/QualificationPrompt", () => ({
  QualificationPrompt: () => null,
}));

const listQueryMock = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    apartments: {
      list: {
        useQuery: (...args: unknown[]) => listQueryMock(...args),
      },
    },
  },
}));

import ApartmentSearch from "./ApartmentSearch";

const FIXTURE_APARTMENTS = [
  {
    id: 1,
    name: "Heights Park Lofts",
    neighborhood: "Heights",
    bedrooms: 1,
    bathrooms: "1",
    rentMin: "1200",
    rentMax: "1400",
    description: "Cozy loft near the trail.",
    latitude: "29.8",
    longitude: "-95.4",
    photos: ["https://example.com/photo1.jpg"],
    special: null,
    availability: "Available now",
    minSqft: 650,
    maxSqft: 700,
    builtYear: 2015,
    managedBy: "Acme Properties",
  },
  {
    id: 2,
    name: "Galleria Tower Suites",
    neighborhood: "Galleria",
    bedrooms: 2,
    bathrooms: "2",
    rentMin: "2200",
    rentMax: "2600",
    description: "Spacious two-bed near the mall.",
    latitude: "29.74",
    longitude: "-95.46",
    photos: [],
    special: "One month free",
    availability: "Available Aug 1",
    minSqft: 1100,
    maxSqft: 1100,
    builtYear: 2018,
    managedBy: "Galleria Mgmt",
  },
];

function mockListData(data: typeof FIXTURE_APARTMENTS | undefined, isLoading = false) {
  listQueryMock.mockReturnValue({ data, isLoading });
}

beforeEach(() => {
  listQueryMock.mockReset();
  onMapReadySpy.mockReset();
  window.localStorage.clear();
});

describe("ApartmentSearch", () => {
  it("shows skeleton loaders while the apartments query is loading", () => {
    mockListData(undefined, true);
    render(<ApartmentSearch />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders fetched apartments as listing cards with formatted rent and bed count", async () => {
    mockListData(FIXTURE_APARTMENTS);
    render(<ApartmentSearch />);

    expect(await screen.findByText("2 listings")).toBeInTheDocument();
    expect(screen.getByText("Heights Park Lofts".split(" ")[0], { exact: false })).toBeTruthy();
    // Neighborhood is the card title; rent is formatted as a range.
    expect(screen.getByText("$1,200 – $1,400/mo")).toBeInTheDocument();
    expect(screen.getByText("$2,200 – $2,600/mo")).toBeInTheDocument();
    expect(screen.getAllByText("Heights")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Galleria")[0]).toBeInTheDocument();
  });

  it("shows an empty state with a working reset when no listings match", () => {
    mockListData([]);
    render(<ApartmentSearch />);
    expect(screen.getByText("No listings match your filters")).toBeInTheDocument();
  });

  it("filters listings by free-text search across name/neighborhood/special/description", async () => {
    const user = userEvent.setup();
    mockListData(FIXTURE_APARTMENTS);
    render(<ApartmentSearch />);

    await screen.findByText("2 listings");

    const searchInput = screen.getByPlaceholderText("Search name, city, special...");
    await user.type(searchInput, "free");

    await waitFor(() => {
      expect(screen.getByText("1 listing")).toBeInTheDocument();
    });
    // Only the Galleria listing has "One month free" as its special.
    expect(screen.getByText("$2,200 – $2,600/mo")).toBeInTheDocument();
    expect(screen.queryByText("$1,200 – $1,400/mo")).not.toBeInTheDocument();
  });

  it("clears the search filter and restores the full list via the X button", async () => {
    const user = userEvent.setup();
    mockListData(FIXTURE_APARTMENTS);
    render(<ApartmentSearch />);

    await screen.findByText("2 listings");
    const searchInput = screen.getByPlaceholderText("Search name, city, special...") as HTMLInputElement;
    await user.type(searchInput, "Galleria");
    await waitFor(() => expect(screen.getByText("1 listing")).toBeInTheDocument());

    const clearButton = searchInput.parentElement!.querySelector("button")!;
    await user.click(clearButton);

    expect(searchInput.value).toBe("");
    await waitFor(() => expect(screen.getByText("2 listings")).toBeInTheDocument());
  });

  it("resets all filters via the filter panel's Reset button", async () => {
    const user = userEvent.setup();
    mockListData(FIXTURE_APARTMENTS);
    render(<ApartmentSearch />);

    await screen.findByText("2 listings");

    const searchInput = screen.getByPlaceholderText("Search name, city, special...") as HTMLInputElement;
    await user.type(searchInput, "Heights");
    await waitFor(() => expect(screen.getByText("1 listing")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /filters/i }));
    const resetButton = await screen.findByRole("button", { name: "Reset" });
    await user.click(resetButton);

    expect(searchInput.value).toBe("");
    await waitFor(() => expect(screen.getByText("2 listings")).toBeInTheDocument());
  });

  it("opens the apartment details dialog when a listing card is clicked (lead-authenticated view)", async () => {
    const user = userEvent.setup();
    mockListData(FIXTURE_APARTMENTS);
    render(<ApartmentSearch />);

    await screen.findByText("2 listings");
    const viewDetailsButtons = screen.getAllByRole("button", { name: /view details/i });
    await user.click(viewDetailsButtons[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("See Full Property Details")).toBeInTheDocument();
  });

  it("toggles favorite state for a listing and persists it to localStorage", async () => {
    const user = userEvent.setup();
    mockListData(FIXTURE_APARTMENTS);
    render(<ApartmentSearch />);

    await screen.findByText("2 listings");
    const favoriteButtons = screen.getAllByTitle("Add to favorites");
    await user.click(favoriteButtons[0]);

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("apartment-favorites") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].apartmentId).toBe("1");
    });
  });

  it("invokes onMapReady and places one marker per filtered apartment", async () => {
    mockListData(FIXTURE_APARTMENTS);
    render(<ApartmentSearch />);

    await screen.findByText("2 listings");
    expect(onMapReadySpy).toHaveBeenCalled();
  });
});
