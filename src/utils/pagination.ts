export type PaginationParams = {
  page?: string | number | null;
  size?: string | number | null;
  maxSize?: number;
  defaultSize?: number;
};

export const parsePagination = ({
  page,
  size,
  maxSize = 50,
  defaultSize = 20,
}: PaginationParams) => {
  const pageNumber = Number(page ?? 0);
  const normalizedPage = Number.isNaN(pageNumber) || pageNumber < 0 ? 0 : pageNumber;

  const sizeNumber = Number(size ?? defaultSize);
  const normalizedSize =
    Number.isNaN(sizeNumber) || sizeNumber < 1
      ? defaultSize
      : Math.min(sizeNumber, maxSize);

  return {
    page: normalizedPage,
    size: normalizedSize,
    skip: normalizedPage * normalizedSize,
    take: normalizedSize,
  };
};

export const parseSortParam = (
  rawSort: string | undefined,
  allowedFields: readonly string[],
  defaultField: string,
  defaultDirection: "asc" | "desc" = "desc",
) => {
  let field = defaultField;
  let direction: "asc" | "desc" = defaultDirection;

  if (rawSort) {
    const [maybeField, maybeDirection] = rawSort.split(",");
    if (maybeField && allowedFields.includes(maybeField)) {
      field = maybeField;
    }
    const lowered = maybeDirection?.toLowerCase();
    if (lowered === "asc" || lowered === "desc") {
      direction = lowered;
    }
  }

  return {
    orderBy: { [field]: direction } as Record<string, "asc" | "desc">,
    sortString: `${field},${direction.toUpperCase()}`,
  };
};
