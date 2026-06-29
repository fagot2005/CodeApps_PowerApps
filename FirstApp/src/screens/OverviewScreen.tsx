import { useEffect, useMemo, useRef, useState } from "react";
import { Cr989_ar_codeappsService } from "../generated/services/Cr989_ar_codeappsService";
import type { Cr989_ar_codeapps } from "../generated/models/Cr989_ar_codeappsModel";
import "./OverviewScreen.css";

type TabKey = "myAccessRights" | "gatekeeper";

const TABS: { key: TabKey; label: string }[] = [
  { key: "myAccessRights", label: "My Access Rights" },
  { key: "gatekeeper", label: "I am a Gatekeeper for" },
];

type ColumnType = "text" | "date" | "bool";

interface ColumnDef {
  key: keyof Cr989_ar_codeapps;
  label: string;
  type: ColumnType;
  width: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "cr989_roletype", label: "Role Type", type: "text", width: "21%" },
  { key: "cr989_rolename", label: "Role Name", type: "text", width: "14%" },
  {
    key: "cr989_roleaccesstype",
    label: "Access Type",
    type: "text",
    width: "19%",
  },
  { key: "cr989_levelcode", label: "Access Level", type: "text", width: "14%" },
  {
    key: "cr989_createdon",
    label: "Access Start Date",
    type: "date",
    width: "14%",
  },
  {
    key: "cr989_isautogranted",
    label: "Auto-granted",
    type: "bool",
    width: "10%",
  },
];

type SortDir = "asc" | "desc";

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function getCellText(record: Cr989_ar_codeapps, column: ColumnDef): string {
  const raw = record[column.key];
  if (column.type === "bool") {
    return raw ? "Yes" : "No";
  }
  if (column.type === "date") {
    return formatDate(raw as string | undefined);
  }
  return raw == null ? "" : String(raw);
}

function OverviewScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("myAccessRights");
  const [records, setRecords] = useState<Cr989_ar_codeapps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Cr989_ar_codeapps | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const previousSortRef = useRef<{
    key: keyof Cr989_ar_codeapps | null;
    dir: SortDir;
  }>({ key: null, dir: "asc" });

  useEffect(() => {
    let cancelled = false;

    async function loadActiveAccessRights() {
      setLoading(true);
      setError(null);
      try {
        const allRecords: Cr989_ar_codeapps[] = [];
        let skipToken: string | undefined = undefined;

        // Dataverse returns at most ~500 records per page, so keep
        // following the skipToken until every page has been fetched.
        do {
          const result = await Cr989_ar_codeappsService.getAll({
            // statecode 0 = Active
            filter: "statecode eq 0",
            orderBy: ["cr989_accessrightname asc"],
            skipToken,
          });

          if (cancelled) {
            return;
          }

          if (!result.success) {
            setError(result.error?.message ?? "Failed to load access rights.");
            return;
          }

          allRecords.push(...(result.data ?? []));
          skipToken = result.skipToken;
        } while (skipToken);

        setRecords(allRecords);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Unexpected error loading data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadActiveAccessRights();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const tabRecords = useMemo(() => {
    if (activeTab === "gatekeeper") {
      return records.filter((r) => Boolean(r.cr989_gatekeeperaccessright));
    }
    return records;
  }, [records, activeTab]);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = tabRecords;

    if (query) {
      result = result.filter((record) =>
        COLUMNS.some((column) =>
          getCellText(record, column).toLowerCase().includes(query),
        ),
      );
    }

    if (sortKey) {
      const column = COLUMNS.find((c) => c.key === sortKey);
      const dir = sortDir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        if (column?.type === "date") {
          const av = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
          const bv = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
          return (av - bv) * dir;
        }
        const av = column ? getCellText(a, column) : String(a[sortKey] ?? "");
        const bv = column ? getCellText(b, column) : String(b[sortKey] ?? "");
        return av.localeCompare(bv) * dir;
      });
    }

    return result;
  }, [tabRecords, search, sortKey, sortDir]);

  useEffect(() => {
    const previousSort = previousSortRef.current;
    const sortChanged =
      previousSort.key !== sortKey || previousSort.dir !== sortDir;

    previousSortRef.current = { key: sortKey, dir: sortDir };

    if (sortChanged && sortKey) {
      setSelectedId(visibleRecords[0]?.cr989_ar_codeappid ?? null);
    }
  }, [sortKey, sortDir, visibleRecords]);

  function toggleSort(key: keyof Cr989_ar_codeapps) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleRefresh() {
    setReloadKey((k) => k + 1);
  }

  function handleClearFilters() {
    setSearch("");
    setSortKey(null);
    setSortDir("asc");
  }

  async function handleDelete(record: Cr989_ar_codeapps) {
    const name =
      record.cr989_rolename ?? record.cr989_accessrightname ?? "this record";
    if (!window.confirm(`Delete access right "${name}"?`)) {
      return;
    }
    try {
      await Cr989_ar_codeappsService.delete(record.cr989_ar_codeappid);
      setRecords((prev) =>
        prev.filter((r) => r.cr989_ar_codeappid !== record.cr989_ar_codeappid),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete record.");
    }
  }

  return (
    <div className="overview-screen">
      {loading && (
        <div className="loading-overlay" aria-live="polite" aria-busy="true">
          <div className="loading-dots" aria-label="Loading access rights">
            {Array.from({ length: 8 }).map((_, index) => (
              <span
                key={index}
                style={{ "--dot-index": index } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}

      <div className="overview-topbar">
        <nav className="overview-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`overview-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === "myAccessRights" &&
                !loading &&
                visibleRecords.length > 0 && (
                  <span className="tab-count">{visibleRecords.length}</span>
                )}
            </button>
          ))}
        </nav>

        <button className="btn-primary" type="button">
          New Request
        </button>
      </div>

      <div className="overview-card">
        <div className="overview-toolbar">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-actions">
            <button
              className="icon-btn"
              type="button"
              title="Filter"
              aria-label="Filter"
            >
              <FilterIcon />
            </button>
            <button
              className="icon-btn"
              type="button"
              title="Clear filters"
              aria-label="Clear filters"
              onClick={handleClearFilters}
            >
              <FilterClearIcon />
            </button>
            <button
              className="icon-btn"
              type="button"
              title="Refresh"
              aria-label="Refresh"
              onClick={handleRefresh}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {error && <div className="grid-error">{error}</div>}

        <div className="grid-scroll">
          <table className="data-grid">
            <colgroup>
              {COLUMNS.map((column) => (
                <col key={String(column.key)} style={{ width: column.width }} />
              ))}
              <col style={{ width: "96px" }} />
            </colgroup>
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th key={String(column.key)}>
                    <button
                      type="button"
                      className="th-sort"
                      onClick={() => toggleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <SortIcon active={sortKey === column.key} dir={sortDir} />
                    </button>
                  </th>
                ))}
                <th className="col-actions" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {!loading && visibleRecords.length === 0 && (
                <tr>
                  <td className="grid-state" colSpan={COLUMNS.length + 1}>
                    No access rights found.
                  </td>
                </tr>
              )}

              {!loading &&
                visibleRecords.map((record) => (
                  <tr
                    key={record.cr989_ar_codeappid}
                    className={
                      selectedId === record.cr989_ar_codeappid ? "selected" : ""
                    }
                    onClick={() => setSelectedId(record.cr989_ar_codeappid)}
                  >
                    {COLUMNS.map((column) => (
                      <td key={String(column.key)}>
                        {getCellText(record, column)}
                      </td>
                    ))}
                    <td className="col-actions">
                      <button
                        className="row-icon info"
                        type="button"
                        title="Details"
                        aria-label="Details"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon />
                      </button>
                      <button
                        className="row-icon delete"
                        type="button"
                        title="Delete"
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(record);
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M7 1.5a5.5 5.5 0 1 0 3.6 9.7l3.1 3.1 1-1-3.1-3.1A5.5 5.5 0 0 0 7 1.5Z"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d="M2 3h12l-4.5 5.5V13L6.5 11V8.5L2 3Z"
      />
    </svg>
  );
}

function FilterClearIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d="M2 3h12l-4.5 5.5V13L6.5 11V8.5L2 3Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M11 11l4 4M15 11l-4 4"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"
      />
      <path fill="currentColor" d="M13.8 2.6l.4 3-3-.5 2.6-2.5Z" />
    </svg>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`sort-icon${active ? " active" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 8 12" width="8" height="12">
        <path
          fill="currentColor"
          opacity={active && dir === "asc" ? 1 : 0.35}
          d="M4 0l3 4H1L4 0Z"
        />
        <path
          fill="currentColor"
          opacity={active && dir === "desc" ? 1 : 0.35}
          d="M4 12l3-4H1l3 4Z"
        />
      </svg>
    </span>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        fill="currentColor"
        d="M7.2 6.9h1.6V12H7.2V6.9ZM8 3.8a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9Z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        d="M5.5 5.8h5M6.7 5.8V5.1h2.6v.7M6.4 5.8l.3 4.6h2.6l.3-4.6"
      />
    </svg>
  );
}

export default OverviewScreen;
