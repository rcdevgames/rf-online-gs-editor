/* eslint-disable default-case, no-fallthrough */
import { get } from 'lodash';

class Field {
  constructor({ type, name, len, as, schemaProps, writerProps }) {
    this.type = type;
    this.name = name;
    this.len = len;
    this.as = as;
    this.schemaProps = schemaProps || {};
    this.writerProps = writerProps || {};
  }

  getAs() {
    return this.as;
  }

  getName() {
    return this.name;
  }

  getType() {
    return this.type;
  }

  getLen() {
    return this.len;
  }

  getWriterProps() {
    return this.writerProps;
  }

  getWriterProp(key, returnDefault = null) {
    return get(this.getWriterProps(), key, returnDefault);
  }

  getWeight() {
    switch (this.getType()) {
      case Boolean:
      case Number:
        switch (this.getLen()) {
          case 8:
            return 1;
          case 16:
            return 2;
          case 32:
            return 4;
          case 64:
            return 8;
        }
      case String:
        switch (this.getAs()) {
          case 'hex':
            switch (this.getLen()) {
              case 8:
                return 1;
              case 16:
                return 2;
              case 32:
                return 4;
            }
          default:
            return this.getLen();
        }
    }

    throw new Error(`Undefined field type ${this.getType()}: ${this.getLen()}`);
  }

  toObject() {
    return {
      type: this.type,
      name: this.name,
    };
  }

  toSchema() {
    return {
      ...this.toObject(),
      props: {
        type: this.type,
        ...this.schemaProps,
      },
    };
  }
}

export default Field;